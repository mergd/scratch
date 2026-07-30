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
