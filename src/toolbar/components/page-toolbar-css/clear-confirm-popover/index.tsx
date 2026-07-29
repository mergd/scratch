import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { originalRequestAnimationFrame } from "../../../utils/freeze-animations";
import { useShadowRoot } from "../../../utils/use-shadow-root";
import styles from "../styles.module.scss";

type ClearConfirmPlacement = {
  top: number;
  left: number;
  placement: "above" | "below";
  arrowLeft: number;
};

export type ClearConfirmPopoverProps = {
  anchorRef: RefObject<HTMLElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ClearConfirmPopover({
  anchorRef,
  onConfirm,
  onCancel,
}: ClearConfirmPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const shadowRoot = useShadowRoot(anchorRef);
  // Never portal to document.body — shadow CSS would not apply.
  const portalTarget = shadowRoot instanceof ShadowRoot ? shadowRoot : null;
  const [placement, setPlacement] = useState<ClearConfirmPlacement | null>(
    null,
  );

  const updatePlacement = useCallback(() => {
    const anchor = anchorRef.current;
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const margin = 8;
    const gap = 12;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const popoverHeight = popover.offsetHeight;
    if (popoverWidth === 0 || popoverHeight === 0) return;

    const spaceAbove = anchorRect.top - margin;
    const spaceBelow = window.innerHeight - anchorRect.bottom - margin;
    const placementSide =
      spaceAbove >= popoverHeight + gap || spaceAbove >= spaceBelow
        ? "above"
        : "below";
    const top =
      placementSide === "above"
        ? anchorRect.top - popoverHeight - gap
        : anchorRect.bottom + gap;
    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    let left = anchorCenterX - popoverWidth / 2;
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - popoverWidth - margin),
    );
    const arrowLeft = anchorCenterX - left;

    setPlacement({
      top,
      left,
      placement: placementSide,
      arrowLeft,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!portalTarget) return;

    updatePlacement();
    const frameId = originalRequestAnimationFrame(updatePlacement);

    const popover = popoverRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && popover
        ? new ResizeObserver(updatePlacement)
        : null;
    resizeObserver?.observe(popover);

    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [portalTarget, updatePlacement]);

  useEffect(() => {
    if (!portalTarget) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [portalTarget, onCancel]);

  if (!portalTarget) return null;

  return createPortal(
    <>
      <div
        className={styles.clearConfirmBackdrop}
        aria-hidden="true"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }}
      />
      <div
        ref={popoverRef}
        className={`${styles.clearConfirm} ${styles.clearConfirmFixed} ${
          placement?.placement === "below" ? styles.clearConfirmBelow : ""
        }`}
        style={
          placement
            ? ({
                top: placement.top,
                left: placement.left,
                ["--clear-confirm-arrow-left" as string]: `${placement.arrowLeft}px`,
              } as React.CSSProperties)
            : { opacity: 0, pointerEvents: "none" }
        }
        onPointerDown={(event) => event.stopPropagation()}
        data-feedback-toolbar
        role="dialog"
        aria-modal="true"
        aria-label="Confirm clear all annotations"
      >
        <p className={styles.clearConfirmText}>Clear all annotations?</p>
        <div className={styles.clearConfirmActions}>
          <button
            type="button"
            className={styles.clearConfirmCancel}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.clearConfirmConfirm}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onConfirm();
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </>,
    portalTarget,
  );
}
