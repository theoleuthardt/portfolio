import {
  bootSteps,
  LOGO_COMPACT,
  LOGO_WIDE,
  OS_NAME,
  OS_VERSION_LINE,
  progressBar,
} from "../terminal/boot";
import { logoShapes } from "../terminal/logoShapes";

/** A text logo drawn as an image: glowing cells and shadow lines. */
function LogoImage({ logo, className }: { logo: string; className: string }) {
  const { blocks, strokes, width, height } = logoShapes(logo);
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMinYMin meet"
    >
      <g className="boot-logo-shadow">
        {strokes.map(({ x1, y1, x2, y2 }, index) => (
          <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g className="boot-logo-face">
        {blocks.map(({ x, y }) => (
          <rect key={`${x},${y}`} x={x} y={y} width={1.04} height={2.04} />
        ))}
      </g>
    </svg>
  );
}

/** Props of {@link BootScreen}. */
export interface BootScreenProps {
  /** How many boot steps have been reached; clamped to the existing steps. */
  reached: number;
}

/**
 * The TheoCloud OS logo with the boot progress bar. The wide logo shows when
 * the terminal itself is wide enough (a container query), so it also fits
 * the smaller screen of the 3D terminal.
 */
export function BootScreen({ reached }: BootScreenProps) {
  const step = bootSteps[Math.min(Math.max(reached, 1), bootSteps.length) - 1];
  return (
    <div className="mb-3">
      <div role="img" aria-label={OS_NAME} className="boot-logo">
        <LogoImage
          logo={LOGO_WIDE}
          className="boot-logo-wide hidden @lg:block"
        />
        <LogoImage
          logo={LOGO_COMPACT}
          className="boot-logo-compact @lg:hidden"
        />
      </div>
      <p className="text-phosphor-dim">{OS_VERSION_LINE}</p>
      <p
        role="progressbar"
        aria-label="booting"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={step.percent}
        className="whitespace-pre-wrap text-phosphor"
      >
        {progressBar(step.percent)}{" "}
        <span className="text-phosphor-dim">{step.label}</span>
      </p>
    </div>
  );
}
