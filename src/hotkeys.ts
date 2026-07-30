import { useEffect, useRef } from "react";

/**
 * Portable keyboard gesture understood by Scratch's built-in listener and
 * host-provided hotkey adapters.
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

export type ScratchHotkeyId =
  | "toggleFeedback"
  | "toggleAnnotation"
  | "escape"
  | "freeze"
  | "toggleMarkers"
  | "copy"
  | "clear"
  | "send";

export type ScratchHotkeyCommand = {
  id: ScratchHotkeyId;
  binding: ActivationKeybinding;
  title: string;
  description?: string;
  group: "Feedback";
  enabled: boolean;
  ignoreInputs: boolean;
  preventDefault: boolean;
  run: (event: KeyboardEvent) => void;
};

/**
 * Host integration point for keyboard shortcut libraries.
 *
 * The returned cleanup unregisters the command. Scratch re-registers when a
 * command's binding, metadata, or enabled state changes.
 */
export type ScratchHotkeyAdapter = {
  register: (command: ScratchHotkeyCommand) => () => void;
};

export type ScratchHotkeys = ScratchHotkeyAdapter | false;

export type ScratchHotkeyBindings = Partial<
  Record<ScratchHotkeyId, ActivationKeybinding | false>
>;

export const DEFAULT_SCRATCH_HOTKEY_BINDINGS = {
  toggleFeedback: {
    code: "KeyU",
    metaOrCtrl: true,
    shift: true,
    alt: false,
  },
  toggleAnnotation: {
    code: "KeyF",
    metaOrCtrl: true,
    shift: true,
    alt: false,
  },
  escape: {
    code: "Escape",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
  freeze: {
    code: "KeyP",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
  toggleMarkers: {
    code: "KeyH",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
  copy: {
    code: "KeyC",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
  clear: {
    code: "KeyX",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
  send: {
    code: "KeyS",
    metaOrCtrl: false,
    shift: false,
    alt: false,
  },
} as const satisfies Record<ScratchHotkeyId, ActivationKeybinding>;

function matchesBinding(
  event: KeyboardEvent,
  binding: ActivationKeybinding,
): boolean {
  const wantsMetaOrCtrl = binding.metaOrCtrl ?? true;
  const hasMetaOrCtrl = event.metaKey || event.ctrlKey;

  return event.code === binding.code &&
    hasMetaOrCtrl === wantsMetaOrCtrl &&
    event.shiftKey === (binding.shift ?? true) &&
    event.altKey === (binding.alt ?? false);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable;
}

export function useScratchHotkey(
  hotkeys: ScratchHotkeys | undefined,
  command: ScratchHotkeyCommand | null,
): void {
  const runRef = useRef(command?.run);
  runRef.current = command?.run;

  const binding = command?.binding;

  useEffect(() => {
    if (!command || !binding || hotkeys === false) return;

    const registration: ScratchHotkeyCommand = {
      ...command,
      run: (event) => runRef.current?.(event),
    };

    if (hotkeys) {
      return hotkeys.register(registration);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!registration.enabled) return;
      if (
        registration.ignoreInputs &&
        isTypingTarget(event.target)
      ) {
        return;
      }
      if (!matchesBinding(event, registration.binding)) return;
      if (registration.preventDefault) event.preventDefault();
      registration.run(event);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    hotkeys,
    command?.id,
    command?.title,
    command?.description,
    command?.group,
    command?.enabled,
    command?.ignoreInputs,
    command?.preventDefault,
    binding?.code,
    binding?.metaOrCtrl,
    binding?.shift,
    binding?.alt,
  ]);
}
