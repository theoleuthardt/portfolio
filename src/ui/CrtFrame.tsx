import type { ReactNode } from "react";

/** Props of {@link CrtFrame}. */
export interface CrtFrameProps {
  children: ReactNode;
}

/**
 * Housing and curved glass of the CRT monitor around the terminal, with a
 * bottom strip that carries the model plate and the power LED.
 */
export function CrtFrame({ children }: CrtFrameProps) {
  return (
    <div className="crt">
      <div className="crt-glass">
        {children}
        <span className="crt-roll" aria-hidden="true" />
      </div>
      <div className="crt-strip" aria-hidden="true">
        <span className="crt-plate">THEO-TERM 3270</span>
        <span className="crt-power">
          <span className="crt-led" />
          PWR
        </span>
      </div>
    </div>
  );
}
