# @fldr/agentation

Prod unlock for [Agentation](https://www.npmjs.com/package/agentation) — always on in development, hidden in production until the user draws **three circles** with the cursor or presses **Cmd/Ctrl+Shift+U**.

## Install

```bash
npm i @fldr/agentation agentation
```

## Usage

```tsx
import { AgentationFeedback } from '@fldr/agentation';

// Vite
<AgentationFeedback isDevelopment={import.meta.env.DEV} />

// Next.js
<AgentationFeedback isDevelopment={process.env.NODE_ENV === 'development'} />
```

All [Agentation props](https://www.npmjs.com/package/agentation) (`onSubmit`, `copyToClipboard`, etc.) are forwarded.

Also exported: `useCircleGesture` if you want the gesture without the toolbar wrapper.
