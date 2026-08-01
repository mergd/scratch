# @fldr/scratch

User feedback toolbar for apps — mark what's confusing. Always on in development; in production, unlock by drawing **three circles** or pressing **Cmd/Ctrl+Shift+U**.

Heavily inspired by / derived from [Agentation](https://github.com/benjitaylor/agentation) by Benji Taylor (see `NOTICE` / `UPSTREAM_LICENSE`). Dom context is still captured for developers and coding agents.

**Live playground:** [scratch.fldr.zip](https://scratch.fldr.zip)

## Install

```bash
npm i @fldr/scratch
```

## Usage

```tsx
import { ScratchFeedback } from '@fldr/scratch';

// Vite
<ScratchFeedback isDevelopment={import.meta.env.DEV} />

// Next.js
<ScratchFeedback isDevelopment={process.env.NODE_ENV === 'development'} />
```

Props like `onSubmit`, `copyToClipboard`, `webhookUrl`, etc. are forwarded to the toolbar.

### Host-managed keyboard shortcuts

Scratch uses browser `keydown` listeners by default. A host application can
instead register every Scratch command with its own shortcut system:

```tsx
import type {
  ScratchHotkeyAdapter,
  ScratchMode,
} from "@fldr/scratch";

const hotkeys: ScratchHotkeyAdapter = {
  register(command) {
    return appShortcuts.register({
      id: `scratch.${command.id}`,
      binding: command.binding,
      title: command.title,
      description: command.description,
      group: command.group,
      enabled: command.enabled,
      ignoreInputs: command.ignoreInputs,
      preventDefault: command.preventDefault,
      run: command.run,
    });
  },
};

function Feedback() {
  const handleModeChange = (mode: ScratchMode) => {
    // Suspend conflicting app shortcuts while mode === "annotating".
  };

  return (
    <ScratchFeedback
      hotkeys={hotkeys}
      onModeChange={handleModeChange}
    />
  );
}
```

Omit `hotkeys` to keep the built-in listeners, or pass `false` to disable all
keyboard shortcuts. Use `hotkeyBindings` to replace or disable individual
bindings. Scratch never installs native keyboard listeners when a host adapter
is supplied.

### Mail-back feedback

When the user opens the mail icon and confirms send, Scratch delivers to every configured destination:

| Prop | Role |
| --- | --- |
| `feedbackUrl` | `POST` JSON `FeedbackMailPayload` (full `url` / `pathname` / `origin` / `title`, `context`, `annotations`, `markdown`, `sentAt`) |
| `webhookUrl` | Also `POST`s the same payload on mail confirm (in addition to existing webhook events) |
| `mailto` | `true` or an email address — opens a `mailto:` summary after HTTP posts |
| `feedbackContext` | Merged into payload as `context` (user id, plan, etc.) |
| `enableMailFeedback` | Force show/hide; defaults to on when any destination above is set |

Also exported: `Scratch` (always-visible toolbar), `FeedbackMailPayload`, and `useCircleGesture`.

## Playground

```bash
bun install
bun run demo
```

Opens a local page with `feedbackUrl="/api/feedback"`. Annotate → mail icon → Send; the last JSON payload appears on the page.

Deployed demo: [scratch.fldr.zip](https://scratch.fldr.zip) (`bun run deploy`).

## Discord webhook proxy

Do not place a Discord webhook URL in browser code: its token grants posting access. The standalone Worker in `proxy/` stores that URL in KV and exposes an opaque endpoint instead. It is intended to run at `feedbackproxy.yet-to-be.com`, separately from the playground Worker.

1. Create a dedicated KV namespace and replace the placeholder `WEBHOOKS` ID in `proxy/wrangler.toml`.
2. Deploy it:

   ```bash
   bun run deploy:proxy
   ```

3. Anyone can register a Discord URL. The raw URL is sent once to the proxy and is not returned:

   ```bash
   curl -X POST https://feedbackproxy.yet-to-be.com/v1/register \
     -H "Content-Type: application/json" \
     --data '{"webhookUrl":"https://discord.com/api/webhooks/..."}'
   ```

The response contains an `endpoint`, such as `https://feedbackproxy.yet-to-be.com/v1/<opaque-id>`. Use it as `webhookUrl` in `ScratchFeedback`; it is the only URL that ships to the browser.

The proxy accepts JSON objects up to 256 KB and accepts any public HTTPS webhook target. Discord webhook URLs are formatted as a safe Discord embed; other targets receive the original JSON payload. Private, loopback, link-local, and credential-bearing URLs are rejected, and redirects are not followed. It never returns or logs the registered URL. Delete the `discord-webhook:<id>` KV key to revoke an endpoint.

The Worker includes two Cloudflare rate-limit bindings: 10 registrations per IP per minute and 60 deliveries per IP-and-endpoint per minute. Choose unique binding namespace IDs for the account, and add a zone-level WAF rule as a stricter global ceiling—Worker rate-limit bindings are location-local and eventually consistent. [Cloudflare's Worker rate-limit documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) describes those limits and their tradeoffs.
