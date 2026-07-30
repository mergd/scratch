import { useEffect, useRef, useState } from "react";
import type { Annotation } from "../../../types";
import {
  IconCheckmarkCircle,
  IconClose,
  IconSendArrow,
  IconXmark,
} from "../../icons";
import styles from "./styles.module.scss";

export type FeedbackMailPayload = {
  url: string;
  pathname: string;
  origin: string;
  title?: string;
  context?: Record<string, unknown>;
  message?: string;
  annotations: Annotation[];
  markdown?: string;
  sentAt: number;
};

export type MailPreviewProps = {
  annotations: Annotation[];
  isVisible: boolean;
  toolbarNearBottom: boolean;
  /** False when no feedbackUrl / webhookUrl / mailto is configured. */
  hasDestination: boolean;
  onClose: () => void;
  /** Deliver to all configured destinations. Returns true on success. */
  onSend: (message?: string) => Promise<boolean>;
  /** After the short thanks beat — clear annotations (parent closes panel). */
  onSendSuccess: () => void;
  onRemoveAnnotation: (id: string) => void;
  onAnnotationHover: (annotation: Annotation | null) => void;
};

type SendStatus = "idle" | "sending" | "sent" | "error";

const THANKS_MS = 1300;

export function MailPreview({
  annotations,
  isVisible,
  toolbarNearBottom,
  hasDestination,
  onClose,
  onSend,
  onSendSuccess,
  onRemoveAnnotation,
  onAnnotationHover,
}: MailPreviewProps) {
  const [status, setStatus] = useState<SendStatus>("idle");
  const [message, setMessage] = useState("");
  const thanksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAnnotations = annotations.length > 0;
  const hasMessage = message.trim().length > 0;
  const hasFeedback = hasAnnotations || hasMessage;
  const canSend = hasFeedback && hasDestination;
  const showingThanks = status === "sent";

  useEffect(() => {
    if (!isVisible) {
      onAnnotationHover(null);
    }
  }, [isVisible, onAnnotationHover]);

  useEffect(() => {
    return () => {
      if (thanksTimerRef.current) {
        clearTimeout(thanksTimerRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    if (!canSend || status === "sending" || status === "sent") return;
    setStatus("sending");
    const ok = await onSend(message.trim() || undefined);
    if (!ok) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
    thanksTimerRef.current = setTimeout(() => {
      thanksTimerRef.current = null;
      setStatus("idle");
      setMessage("");
      onSendSuccess();
      onClose();
    }, THANKS_MS);
  };

  const sendLabel =
    status === "sending"
      ? "Sending…"
      : status === "error"
        ? "Try again"
        : "Send";

  return (
    <div
      className={styles.mailPreviewRoot}
      style={
        toolbarNearBottom
          ? { bottom: "auto", top: "calc(100% + 0.5rem)" }
          : undefined
      }
    >
      <div
        className={`${styles.mailPreview} ${isVisible ? styles.enter : styles.exit}`}
        data-scratch-mail-preview
        role="dialog"
        aria-label={showingThanks ? "Feedback sent" : "Send feedback"}
      >
        <div
          className={`${styles.stage} ${showingThanks ? styles.stageSent : ""}`}
        >
          <div className={styles.formPane}>
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <span className={styles.titleIcon} aria-hidden>
                  <IconSendArrow size={12} state="idle" />
                </span>
                <span className={styles.title}>Send feedback</span>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close"
                disabled={showingThanks}
              >
                <IconClose size={12} />
              </button>
            </div>

            <div className={styles.body}>
              {!hasDestination ? (
                <p className={styles.empty}>
                  No feedback destination configured. Pass{" "}
                  <code>feedbackUrl</code>, <code>webhookUrl</code>, or{" "}
                  <code>mailto</code> to enable sending.
                </p>
              ) : (
                <>
                  {hasAnnotations ? (
                    <ul className={styles.list}>
                      {annotations.map((annotation, index) => (
                        <li
                          key={annotation.id}
                          className={styles.item}
                          onMouseEnter={() => onAnnotationHover(annotation)}
                          onMouseLeave={() => onAnnotationHover(null)}
                        >
                          <span className={styles.itemIndex}>{index + 1}</span>
                          <div className={styles.itemBody}>
                            <span className={styles.itemLabel}>
                              {annotation.element}
                            </span>
                            <span className={styles.itemComment}>
                              {annotation.comment}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={() => onRemoveAnnotation(annotation.id)}
                            aria-label={`Remove annotation ${index + 1}`}
                            disabled={showingThanks}
                          >
                            <IconXmark size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : !hasMessage ? (
                    <p className={styles.empty}>
                      Click the page to add annotations.
                    </p>
                  ) : null}

                  <div className={styles.messageField}>
                    <label
                      className={styles.messageLabel}
                      htmlFor="scratch-feedback-message"
                    >
                      Anything else?
                    </label>
                    <textarea
                      id="scratch-feedback-message"
                      className={styles.messageInput}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="Optional overall notes…"
                      rows={2}
                      disabled={showingThanks}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.metaKey || event.ctrlKey)
                        ) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {hasDestination && (
              <div className={styles.footer}>
                {status === "error" && (
                  <p className={styles.errorText}>
                    Couldn&apos;t send. Check the endpoint and try again.
                  </p>
                )}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={onClose}
                    disabled={status === "sending" || showingThanks}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`${styles.primaryButton} ${status === "error" ? styles.primaryError : ""}`}
                    onClick={() => void handleSend()}
                    disabled={!canSend || status === "sending" || showingThanks}
                  >
                    {sendLabel}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className={styles.successPane}
            aria-live="polite"
            aria-hidden={!showingThanks}
          >
            <div className={styles.successContent}>
              <span className={styles.successIcon} aria-hidden>
                <IconCheckmarkCircle size={36} />
              </span>
              <span className={styles.successText}>Thanks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Build the JSON body POSTed to feedbackUrl / webhookUrl on mail confirm. */
export function buildFeedbackMailPayload(
  annotations: Annotation[],
  options: {
    context?: Record<string, unknown>;
    markdown?: string;
    message?: string;
  } = {},
): FeedbackMailPayload {
  const href = typeof window !== "undefined" ? window.location.href : "";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const title =
    typeof document !== "undefined" ? document.title || undefined : undefined;

  return {
    url: href,
    pathname,
    origin,
    title,
    context: options.context,
    message: options.message,
    annotations,
    markdown: options.markdown,
    sentAt: Date.now(),
  };
}

/** Build a mailto: link summarizing annotations (full page URL in body). */
export function buildFeedbackMailtoHref(
  payload: FeedbackMailPayload,
  mailto: string | true,
): string {
  const address = mailto === true ? "" : mailto.trim();
  const subject = `Page feedback: ${payload.pathname || payload.url}`;
  const lines = payload.annotations.map((annotation, index) => {
    const comment = annotation.comment.trim() || "(no comment)";
    return `${index + 1}. ${annotation.element}\n   ${comment}`;
  });
  const body = [
    `Feedback for ${payload.url}`,
    payload.title ? `Title: ${payload.title}` : null,
    payload.message ? `\nGeneral comment:\n${payload.message}` : null,
    lines.length > 0 ? "" : null,
    ...lines,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
