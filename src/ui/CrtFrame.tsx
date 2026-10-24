import type { ReactNode } from "react";

/** The window keys of the terminal app; absent where they make no sense. */
export interface CrtControls {
  onMinimize: () => void;
  onClose: () => void;
  onToggleMaximize: () => void;
  maximized: boolean;
}

/** Props of {@link CrtFrame}. */
export interface CrtFrameProps {
  /** Window title of the terminal app on the screen. */
  title: string;
  children: ReactNode;
  controls?: CrtControls;
}

/**
 * A worn CRT tube monitor: a weathered metal housing with a riveted bezel,
 * the curved glass set back into it and a front panel with vents, knobs, the
 * model plate, buttons and the power LED. On the screen runs the terminal
 * app as a window with a title bar and the minimize, maximize and close keys.
 */
export function CrtFrame({ title, children, controls }: CrtFrameProps) {
  return (
    <div className="crt">
      <div className="crt-bezel">
        <div className="crt-glass">
          <div className="crt-titlebar">
            <span className="crt-title">{title}</span>
            {controls ? (
              <span className="crt-keys">
                <button
                  type="button"
                  className="crt-key"
                  aria-label="minimize terminal"
                  onClick={controls.onMinimize}
                >
                  <span aria-hidden="true">_</span>
                </button>
                <button
                  type="button"
                  className="crt-key"
                  aria-label="maximize terminal"
                  aria-pressed={controls.maximized}
                  onClick={controls.onToggleMaximize}
                >
                  <span aria-hidden="true">□</span>
                </button>
                <button
                  type="button"
                  className="crt-key"
                  aria-label="close terminal"
                  onClick={controls.onClose}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            ) : null}
          </div>
          <div className="crt-viewport">{children}</div>
          <span className="crt-roll" aria-hidden="true" />
        </div>
      </div>
      <div className="crt-strip" aria-hidden="true">
        <span className="crt-vents" />
        <span className="crt-knobs">
          <span className="crt-knob" />
          BRT
          <span className="crt-knob" />
          CONT
        </span>
        <span className="crt-plate">THEO-TERM 3270</span>
        <span className="crt-power">
          <span className="crt-button" />
          <span className="crt-button" />
          <span className="crt-led" />
          PWR
        </span>
      </div>
    </div>
  );
}
