import { ICONS, iconRuns, type IconName } from "../../desktop/icons";

/** A 1-bit desktop icon, drawn with crisp pixels. */
export function PixelIcon({ name }: { name: IconName }) {
  return (
    <svg
      className="desk-icon-image"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {iconRuns(ICONS[name]).map(({ x, y, width }) => (
        <rect key={`${x},${y}`} x={x} y={y} width={width} height={1} />
      ))}
    </svg>
  );
}
