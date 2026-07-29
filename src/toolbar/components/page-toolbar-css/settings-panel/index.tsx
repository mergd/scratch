import { COLOR_OPTIONS, type ToolbarSettings } from "..";
import { HelpTooltip } from "../../help-tooltip";
import { IconMoon, IconSun } from "../../icons";
import { Switch } from "../../switch";
import { CheckboxField } from "./checkbox-field";
import styles from "./styles.module.scss";

export type SettingsPanelProps = {
  settings: ToolbarSettings;
  onSettingsChange: (patch: Partial<ToolbarSettings>) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isVisible: boolean;
  toolbarNearBottom: boolean;
  onHideToolbar: () => void;
};

export function SettingsPanel({
  settings,
  onSettingsChange,
  isDarkMode,
  onToggleTheme,
  isVisible,
  toolbarNearBottom,
  onHideToolbar,
}: SettingsPanelProps) {
  return (
    <div
      className={`${styles.settingsPanel} ${isVisible ? styles.enter : styles.exit}`}
      style={
        toolbarNearBottom
          ? { bottom: "auto", top: "calc(100% + 0.5rem)" }
          : undefined
      }
      data-agentation-settings-panel
    >
      <div className={styles.settingsPanelContainer}>
        <div className={styles.settingsPage}>
          <div className={styles.settingsHeader}>
            <span className={styles.settingsBrand}>@fldr/agentation</span>
            <p className={styles.settingsVersion}>v{__VERSION__}</p>
            <button
              className={styles.themeToggle}
              onClick={onToggleTheme}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className={styles.themeIconWrapper}>
                <span
                  key={isDarkMode ? "sun" : "moon"}
                  className={styles.themeIcon}
                >
                  {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
                </span>
              </span>
            </button>
          </div>

          <div className={styles.divider} />

          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <div className={styles.settingsLabel}>
                Hide Until Restart
                <HelpTooltip content="Hides the toolbar until you open a new tab" />
              </div>
              <Switch
                checked={false}
                onChange={(event) => {
                  if (event.target.checked) onHideToolbar();
                }}
              />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.settingsSection}>
            <div
              className={`${styles.settingsLabel} ${styles.settingsLabelMarker}`}
            >
              Marker Color
            </div>
            <div className={styles.colorOptions}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  className={`${styles.colorOption} ${settings.annotationColorId === color.id ? styles.selected : ""}`}
                  style={
                    {
                      "--swatch": color.srgb,
                      "--swatch-p3": color.p3,
                    } as React.CSSProperties
                  }
                  onClick={() =>
                    onSettingsChange({ annotationColorId: color.id })
                  }
                  title={color.label}
                  type="button"
                  key={color.id}
                />
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.settingsSection}>
            <CheckboxField
              className="checkbox-field"
              label="Clear on copy/send"
              checked={settings.autoClearAfterCopy}
              onChange={(event) =>
                onSettingsChange({ autoClearAfterCopy: event.target.checked })
              }
              tooltip="Automatically clear annotations after copying"
            />
            <CheckboxField
              className={styles.checkboxField}
              label="Block page interactions"
              checked={settings.blockInteractions}
              onChange={(event) =>
                onSettingsChange({ blockInteractions: event.target.checked })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
