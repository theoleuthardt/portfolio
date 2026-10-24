import type { ReactNode } from "react";

/** The window buttons in the housing; absent where they make no sense. */
export interface CrtControls {
  onMinimize: () => void;
  onClose: () => void;
}

/** Props of {@link CrtFrame}. */
export interface CrtFrameProps {
  children: ReactNode;
  controls?: CrtControls;
}

/**
 * The CRT tube monitor around the terminal: a thick housing with the
 * minimize and close keys on top, the curved glass set back into a recessed
 * bezel, and a front panel with knobs, the model plate and the power LED.
 */
export function CrtFrame({ children, controls }: CrtFrameProps) {
  return (
    <div className="crt">
      <div className="crt-head">
        <span className="crt-badge" aria-hidden="true">
          TheoCloud OS · tty1
        </span>
        {controls ? (
          <div className="crt-keys">
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
              className="crt-key crt-key-close"
              aria-label="close terminal"
              onClick={controls.onClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : null}
      </div>
      <div className="crt-bezel">
        <div className="crt-glass">
          {children}
          <span className="crt-roll" aria-hidden="true" />
        </div>
      </div>
      <div className="crt-strip" aria-hidden="true">
        <span className="crt-knobs">
          <span className="crt-knob" />
          BRT
          <span className="crt-knob" />
          CONT
        </span>
        <span className="crt-plate">THEO-TERM 3270</span>
        <span className="crt-power">
          <span className="crt-led" />
          PWR
        </span>
      </div>
    </div>
  );
}
