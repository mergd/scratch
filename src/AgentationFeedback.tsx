import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { Agentation, COLOR_OPTIONS, type AnnotationColorId } from './toolbar';
import {
  FeedbackGuide,
  shouldShowFeedbackGuide,
  type FeedbackGuideCopy,
} from './feedback-guide';
import { useCircleGesture } from './use-circle-gesture';

const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

export type AgentationFeedbackProps = ComponentProps<typeof Agentation> & {
  /**
   * When true, the toolbar starts visible (typical for local dev).
   * Defaults to false — unlock via three circles or Cmd/Ctrl+Shift+U.
   */
  isDevelopment?: boolean;
  /**
   * Inactivity before auto-dismiss when unlocked via the production path.
   * Defaults to 30_000 ms. Pass `false` or `0` to disable idle dismiss.
   */
  idleTimeoutMs?: number | false;
  /** Customize unlock-guide copy (title, body, steps, button labels). */
  guide?: FeedbackGuideCopy;
  /**
   * Default annotation / accent color (COLOR_OPTIONS ids).
   * Sets the initial marker color and tints the guide primary button.
   */
  primaryColor?: AnnotationColorId;
  /**
   * Show the copy button in the toolbar. Defaults to true.
   * `copyToClipboard` still controls whether the clipboard write runs on copy.
   */
  enableCopy?: boolean;
};

/**
 * Feedback toolbar. Always-on when `isDevelopment` is true;
 * otherwise hidden until the user draws three circles with their cursor
 * or presses Cmd/Ctrl+Shift+U.
 *
 * On unlock, shows a short guide once (persisted in a cookie after any dismiss).
 */
export function AgentationFeedback({
  isDevelopment = false,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  guide,
  primaryColor,
  ...agentationProps
}: AgentationFeedbackProps) {
  const [active, setActive] = useState(isDevelopment);
  const [guideOpen, setGuideOpen] = useState(
    () => isDevelopment && shouldShowFeedbackGuide(),
  );
  const [idleBlocked, setIdleBlocked] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setActive(false);
    setGuideOpen(false);
  }, []);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const bumpActivity = useCallback(() => {
    if (isDevelopment || !active) {
      return;
    }

    clearIdleTimer();

    if (idleBlocked || guideOpen) {
      return;
    }

    if (idleTimeoutMs === false || idleTimeoutMs === 0) {
      return;
    }

    idleTimerRef.current = setTimeout(dismiss, idleTimeoutMs);
  }, [
    isDevelopment,
    active,
    idleBlocked,
    guideOpen,
    dismiss,
    clearIdleTimer,
    idleTimeoutMs,
  ]);

  const toggle = useCallback(() => {
    setActive((wasActive) => {
      if (wasActive) {
        setGuideOpen(false);
        return false;
      }
      if (shouldShowFeedbackGuide()) {
        setGuideOpen(true);
      }
      return true;
    });
  }, []);

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

  useEffect(() => {
    if (!active || isDevelopment) {
      clearIdleTimer();
      return;
    }

    if (idleBlocked || guideOpen) {
      clearIdleTimer();
      return;
    }

    bumpActivity();
    return clearIdleTimer;
  }, [active, isDevelopment, idleBlocked, guideOpen, bumpActivity, clearIdleTimer]);

  if (!active) {
    return null;
  }

  const accent = primaryColor
    ? COLOR_OPTIONS.find((c) => c.id === primaryColor)?.srgb
    : undefined;

  return (
    <>
      <Agentation
        {...agentationProps}
        primaryColor={primaryColor}
        startActive
        onRequestClose={dismiss}
        onActivity={bumpActivity}
        onIdleBlockedChange={setIdleBlocked}
      />
      <FeedbackGuide
        open={guideOpen}
        onClose={() => {
          setGuideOpen(false);
          bumpActivity();
        }}
        onDismissFeedback={dismiss}
        onActivity={bumpActivity}
        accentColor={accent}
        {...guide}
      />
    </>
  );
}
