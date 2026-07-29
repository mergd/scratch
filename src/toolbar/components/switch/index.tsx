import styles from "./styles.module.scss";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Switch = ({
  className = "",
  checked,
  disabled,
  onChange,
  ...props
}: SwitchProps) => {
  return (
    <div
      className={`${styles.switchContainer} ${className}`}
      data-checked={checked ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
    >
      <input
        className={styles.switchInput}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
        {...props}
      />
      <div className={styles.switchThumb} />
    </div>
  );
};
