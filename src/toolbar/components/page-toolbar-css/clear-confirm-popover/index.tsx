import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
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

function isNodeInComposedPath(event: Event, node: Node | null | undefined) {
  if (!node) return false;
  return event.composedPath().includes(node);
}

export function ClearConfirmPopover({
  anchorRef,
  onConfirm,
  onCancel,
}: ClearConfirmPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const shadowRoot = useShadowRoot(anchorRef);
  const portalTarget =
    shadowRoot instanceof ShadowRoot ? shadowRoot : document.body;
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
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [updatePlacement]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        isNodeInComposedPath(event, anchorRef.current) ||
        isNodeInComposedPath(event, popoverRef.current)
      ) {
        return;
      }
      onCancel();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [anchorRef, onCancel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel]);

  return createPortal(
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
          : { visibility: "hidden" }
      }
      data-feedback-toolbar
      role="dialog"
      aria-label="Confirm clear all annotations"
    >
      <p className={styles.clearConfirmText}>Clear all annotations?</p>
      <div className={styles.clearConfirmActions}>
        <button
          type="button"
          className={styles.clearConfirmCancel}
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
          onClick={(event) => {
            event.stopPropagation();
            onConfirm();
          }}
        >
          Clear
        </button>
      </div>
    </div>,
    portalTarget,
  );
}
