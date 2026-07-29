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

Also exported: `Agentation` (always-visible toolbar) and `useCircleGesture`.

## Playground

```bash
bun install
bun run demo
```

Opens a local page for trying circle / keyboard unlock and annotations.
