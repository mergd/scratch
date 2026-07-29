import styles from "./styles.module.scss";

const DOT_COLS = 2;
const DOT_ROWS = 4;

type DragHandleProps = {
  grabbing?: boolean;
};

export function DragHandle({ grabbing = false }: DragHandleProps) {
  return (
    <div
      className={`${styles.dragHandle} ${grabbing ? styles.grabbing : ""}`}
      aria-label="Drag to reposition toolbar"
      data-toolbar-drag-handle
    >
      <span className={styles.knurl} aria-hidden>
        {Array.from({ length: DOT_COLS * DOT_ROWS }, (_, index) => (
          <span key={index} className={styles.dot} />
        ))}
      </span>
    </div>
  );
}
