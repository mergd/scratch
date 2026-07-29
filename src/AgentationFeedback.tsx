import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Agentation } from './toolbar';
import { useCircleGesture } from './use-circle-gesture';

export type AgentationFeedbackProps = ComponentProps<typeof Agentation> & {
  /**
   * When true, the toolbar starts visible (typical for local dev).
   * Defaults to false — unlock via three circles or Cmd/Ctrl+Shift+U.
   */
  isDevelopment?: boolean;
};

/**
 * Feedback toolbar. Always-on when `isDevelopment` is true;
 * otherwise hidden until the user draws three circles with their cursor
 * or presses Cmd/Ctrl+Shift+U.
 */
export function AgentationFeedback({
  isDevelopment = false,
  ...agentationProps
}: AgentationFeedbackProps) {
  const [active, setActive] = useState(isDevelopment);

  const toggle = useCallback(() => setActive((value) => !value), []);
  useCircleGesture(toggle, !isDevelopment);

  useEffect(() => {
    if (isDevelopment) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'KeyU') {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevelopment, toggle]);

  if (!active) {
    return null;
  }

  return <Agentation {...agentationProps} />;
}
