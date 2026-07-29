import { useEffect, useId, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ShadowRoot } from "./toolbar/components/shadow-root";
import { css as resetCss } from "./toolbar/components/reset.scss";
import styles, { css as guideCss } from "./feedback-guide.module.scss";

const COOKIE_NAME = "fldr_scratch_hide_guide";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

const shadowCss = [resetCss, guideCss].join("\n");

const DEFAULT_STEPS = [
  "Click an element or drag to select an area",
  "Write what's confusing",
  "Send feedback or copy it",
] as const;

export type FeedbackGuideCopy = {
  eyebrow?: string;
  title?: string;
  body?: string;
  steps?: string[];
  gotItLabel?: string;
  dismissFeedbackLabel?: string;
};

export type FeedbackGuideProps = FeedbackGuideCopy & {
  open: boolean;
  onClose: () => void;
  /** Exit feedback mode (e.g. deactivate toolbar). */
  onDismissFeedback?: () => void;
  /** Accent for the primary button (e.g. COLOR_OPTIONS srgb). */
  accentColor?: string;
  /** Fired on guide interaction to reset parent idle timers. */
  onActivity?: () => void;
};

function readGuideDismissed(): boolean {
  if (typeof document === "undefined") {
    return true;
  }
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${COOKIE_NAME}=`));
}

function writeGuideDismissed(): void {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/**
 * One-time intro shown when feedback mode unlocks.
 * Any dismiss persists via cookie so the guide only appears once.
 */
export function FeedbackGuide({
  open,
  onClose,
  onDismissFeedback,
  onActivity,
  accentColor,
  eyebrow,
  title = "Feedback",
  body = "Click anything that feels unclear, add a short note, then send or copy it.",
  steps = [...DEFAULT_STEPS],
  gotItLabel = "Got it",
  dismissFeedbackLabel = "No thanks",
}: FeedbackGuideProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissGuide = () => {
    onActivity?.();
    writeGuideDismissed();
    onClose();
  };

  const dismissFeedback = () => {
    onActivity?.();
    writeGuideDismissed();
    onDismissFeedback?.();
    onClose();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismissGuide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onActivity, onClose]);

  if (!mounted || !open) {
    return null;
  }

  const handleGuideActivity = () => {
    onActivity?.();
  };

  const cardStyle = accentColor
    ? ({ ["--guide-accent" as string]: accentColor } as CSSProperties)
    : undefined;

  return createPortal(
    <ShadowRoot
      host="scratch-feedback-guide"
      data-feedback-guide=""
      style={{ display: "contents" }}
    >
      <style>{shadowCss}</style>
      <div
        className={styles.root}
        role="presentation"
        onPointerDown={handleGuideActivity}
      >
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Dismiss guide"
          onClick={dismissGuide}
        />
        <div
          className={styles.card}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={cardStyle}
        >
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {body ? <p className={styles.body}>{body}</p> : null}
          {steps.length > 0 ? (
            <ol className={styles.steps}>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={dismissGuide}
            >
              {gotItLabel}
            </button>
            <button
              type="button"
              className={styles.ghost}
              onClick={dismissFeedback}
            >
              {dismissFeedbackLabel}
            </button>
          </div>
          <div className={styles.arrow} aria-hidden="true">
            <svg
              className={styles.arrowBorder}
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
            >
              <path
                d="M2 0.5h16c1.1 0 2 .9 2 2v8.8c0 1.6-1.7 2.2-2.7 1.3l-4.8-3.8c-.6-.5-1.4-.5-2 0l-4.8 3.8c-1 0.9-2.7 0.3-2.7-1.3V2.5c0-1.1.9-2 2-2z"
                fill="currentColor"
              />
            </svg>
            <svg
              className={styles.arrowFill}
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
            >
              <path
                d="M3 1h14c.6 0 1 .4 1 1v7.6c0 1.1-1.4 1.5-2.1 0.8l-4.5-3.6c-.7-.6-1.7-.6-2.4 0l-4.5 3.6c-.7 0.7-2.1 0.3-2.1-0.8V2c0-.6.4-1 1-1z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </ShadowRoot>,
    document.body,
  );
}

export function shouldShowFeedbackGuide(): boolean {
  return !readGuideDismissed();
}
