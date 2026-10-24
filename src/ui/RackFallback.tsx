import { findProject, RACK_UNITS } from "../content/projects";
import { rackSlots } from "../content/rack";

const UNIT = 18;
const TOP = 40;
const slots = rackSlots();

/** Static rack illustration shown instead of the 3D scene without WebGL. */
export function RackFallback() {
  return (
    <svg
      role="img"
      aria-label="Server rack with the project modules"
      viewBox={`0 0 240 ${TOP * 2 + RACK_UNITS * UNIT}`}
      className="h-[70vh] max-h-[640px] w-auto opacity-80"
    >
      <rect
        x="20"
        y={TOP - 10}
        width="200"
        height={RACK_UNITS * UNIT + 20}
        rx="4"
        className="fill-bezel stroke-line"
      />
      {slots.map((slot) => {
        const y = TOP + slot.unit * UNIT;
        return (
          <g key={slot.id}>
            <rect
              x="30"
              y={y}
              width="180"
              height={slot.units * UNIT - 3}
              className="fill-glass stroke-line"
            />
            <circle
              cx="195"
              cy={y + 6}
              r="2.5"
              className={
                findProject(slot.id)?.fork ? "fill-amber" : "fill-phosphor"
              }
            />
            <text x="38" y={y + 11} className="fill-phosphor-dim text-[8px]">
              {slot.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
