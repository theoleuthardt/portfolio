import {
  bootSteps,
  LOGO_COMPACT,
  LOGO_WIDE,
  OS_NAME,
  OS_VERSION_LINE,
  progressBar,
} from "../terminal/boot";

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
        <pre aria-hidden="true" className="hidden @lg:block">
          {LOGO_WIDE}
        </pre>
        <pre aria-hidden="true" className="@lg:hidden">
          {LOGO_COMPACT}
        </pre>
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
