import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { Scratch, COLOR_OPTIONS, type AnnotationColorId } from './toolbar';
import {
  DEFAULT_SCRATCH_HOTKEY_BINDINGS,
  type ActivationKeybinding,
  type ScratchHotkeys,
  useScratchHotkey,
} from './hotkeys';
import {
  FeedbackGuide,
  shouldShowFeedbackGuide,
  type FeedbackGuideCopy,
} from './feedback-guide';
import { useCircleGesture } from './use-circle-gesture';

const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

const DEFAULT_ACTIVATION_KEYBINDING =
  DEFAULT_SCRATCH_HOTKEY_BINDINGS.toggleFeedback;

export type ScratchMode = 'hidden' | 'ready' | 'annotating';

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
  /**
   * Observe whether feedback is hidden, visible, or actively annotating.
   * Hosts can use this to suspend conflicting application shortcuts.
   */
  onModeChange?: (mode: ScratchMode) => void;
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
  activationKeybinding,
  hotkeys,
  hotkeyBindings,
  onModeChange,
  guide,
  primaryColor,
  ...scratchProps
}: ScratchFeedbackProps) {
  const [active, setActive] = useState(isDevelopment);
  const [guideOpen, setGuideOpen] = useState(
    () => isDevelopment && shouldShowFeedbackGuide(),
  );
  const [idleBlocked, setIdleBlocked] = useState(false);
  const [annotating, setAnnotating] = useState(isDevelopment);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setActive(false);
    setAnnotating(false);
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

  const activationOverride = activationKeybinding ??
    hotkeyBindings?.toggleFeedback;
  const activationBinding = activationOverride === false
    ? null
    : {
      ...DEFAULT_ACTIVATION_KEYBINDING,
      ...activationOverride,
    };

  useScratchHotkey(
    hotkeys as ScratchHotkeys | undefined,
    activationBinding
      ? {
        id: 'toggleFeedback',
        binding: activationBinding,
        title: 'Toggle feedback',
        description: 'Open or close the Scratch feedback toolbar',
        group: 'Feedback',
        enabled: !isDevelopment,
        ignoreInputs: false,
        preventDefault: true,
        run: toggle,
      }
      : null,
  );

  useEffect(() => {
    onModeChange?.(
      active ? (annotating ? 'annotating' : 'ready') : 'hidden',
    );
  }, [active, annotating, onModeChange]);

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
        hotkeys={hotkeys}
        hotkeyBindings={hotkeyBindings}
        primaryColor={primaryColor}
        startActive
        onAnnotationModeChange={setAnnotating}
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
