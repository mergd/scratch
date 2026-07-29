# @fldr/agentation

User feedback toolbar for apps — mark what's confusing. Always on in development; in production, unlock by drawing **three circles** or pressing **Cmd/Ctrl+Shift+U**.

Forked from [Agentation](https://github.com/benjitaylor/agentation) (see `NOTICE` / `UPSTREAM_LICENSE`). Dom context is still captured for developers and coding agents.

## Install

```bash
npm i @fldr/agentation
```

## Usage

```tsx
import { AgentationFeedback } from '@fldr/agentation';

// Vite
<AgentationFeedback isDevelopment={import.meta.env.DEV} />

// Next.js
<AgentationFeedback isDevelopment={process.env.NODE_ENV === 'development'} />
```

Props like `onSubmit`, `copyToClipboard`, `webhookUrl`, etc. are forwarded to the toolbar.

### Mail-back feedback

When the user opens the mail icon and confirms send, Agentation delivers to every configured destination:

| Prop | Role |
| --- | --- |
| `feedbackUrl` | `POST` JSON `FeedbackMailPayload` (full `url` / `pathname` / `origin` / `title`, `context`, `annotations`, `markdown`, `sentAt`) |
| `webhookUrl` | Also `POST`s the same payload on mail confirm (in addition to existing webhook events) |
| `mailto` | `true` or an email address — opens a `mailto:` summary after HTTP posts |
| `feedbackContext` | Merged into payload as `context` (user id, plan, etc.) |
| `enableMailFeedback` | Force show/hide; defaults to on when any destination above is set |

Also exported: `Agentation` (always-visible toolbar), `FeedbackMailPayload`, and `useCircleGesture`.

## Playground

```bash
bun install
bun run demo
```

Opens a local page with `feedbackUrl="/api/feedback"`. Annotate → mail icon → Send; the last JSON payload appears on the page.
