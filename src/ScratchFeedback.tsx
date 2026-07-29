import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { Scratch, COLOR_OPTIONS, type AnnotationColorId } from './toolbar';
import {
  FeedbackGuide,
  shouldShowFeedbackGuide,
  type FeedbackGuideCopy,
} from './feedback-guide';
import { useCircleGesture } from './use-circle-gesture';

const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

/**
 * Keyboard shortcut that unlocks ScratchFeedback in production.
 * Defaults to Cmd/Ctrl+Shift+U (`code: "KeyU"` with metaOrCtrl + shift).
 */
export type ActivationKeybinding = {
  /** `KeyboardEvent.code`, e.g. `"KeyU"`, `"KeyF"`, `"Slash"`. */
  code: string;
  /** Require Cmd (macOS) or Ctrl (Windows/Linux). Defaults to true. */
  metaOrCtrl?: boolean;
  /** Require Shift. Defaults to true. */
  shift?: boolean;
  /** Require Alt/Option. Defaults to false. */
  alt?: boolean;
};

const DEFAULT_ACTIVATION_KEYBINDING: Required<ActivationKeybinding> = {
  code: 'KeyU',
  metaOrCtrl: true,
  shift: true,
  alt: false,
};

function matchesActivationKeybinding(
  event: KeyboardEvent,
  binding: ActivationKeybinding,
): boolean {
  const metaOrCtrl = binding.metaOrCtrl ?? true;
  const shift = binding.shift ?? true;
  const alt = binding.alt ?? false;

  if (event.code !== binding.code) {
    return false;
  }
  if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) {
    return false;
  }
  if (shift && !event.shiftKey) {
    return false;
  }
  if (alt && !event.altKey) {
    return false;
  }
  return true;
}

export type ScratchFeedbackProps = ComponentProps<typeof Scratch> & {
  /**
   * When true, the toolbar starts visible (typical for local dev).
   * Defaults to false — unlock via three circles or the activation keybinding.
   */
  isDevelopment?: boolean;
  /**
   * Inactivity before auto-dismiss when unlocked via the production path.
   * Defaults to 30_000 ms. Pass `false` or `0` to disable idle dismiss.
   */
  idleTimeoutMs?: number | false;
  /**
   * Shortcut to unlock feedback when not in development mode.
   * Defaults to Cmd/Ctrl+Shift+U. Pass `false` to disable keyboard unlock
   * (circle gesture still works).
   */
  activationKeybinding?: ActivationKeybinding | false;
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
 * or presses the activation keybinding (default Cmd/Ctrl+Shift+U).
 *
 * On unlock, shows a short guide once (persisted in a cookie after any dismiss).
 */
export function ScratchFeedback({
  isDevelopment = false,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  activationKeybinding = DEFAULT_ACTIVATION_KEYBINDING,
  guide,
  primaryColor,
  ...scratchProps
}: ScratchFeedbackProps) {
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
    if (isDevelopment || activationKeybinding === false) {
      return;
    }

    const binding = {
      ...DEFAULT_ACTIVATION_KEYBINDING,
      ...activationKeybinding,
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (matchesActivationKeybinding(event, binding)) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevelopment, activationKeybinding, toggle]);

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
      <Scratch
        {...scratchProps}
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
