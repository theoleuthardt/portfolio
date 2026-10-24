import type { ReactNode } from "react";

/** Props of {@link CrtFrame}. */
export interface CrtFrameProps {
  children: ReactNode;
}

/** Housing and curved glass of the CRT monitor around the terminal. */
export function CrtFrame({ children }: CrtFrameProps) {
  return (
    <div className="crt">
      <div className="crt-glass">
        {children}
        <span className="crt-roll" aria-hidden="true" />
      </div>
      <span className="crt-label" aria-hidden="true">
        THEO-TERM 3270
      </span>
      <span className="crt-led" aria-hidden="true" />
    </div>
  );
}
