import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  WORLD_VIEW,
  fromDot,
  mapSummary,
  pan,
  parseWorld,
  rasterize,
  screenToDot,
  statusLine,
  zoomBy,
  type MapFrame,
  type World,
} from "../terminal/worldMap";
import { ProgramScreen } from "./ProgramScreen";
import { useElapsed } from "./useElapsed";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const CELL_WIDTH = 8;
const CELL_HEIGHT = 16;
const STATUS_HEIGHT = 48;
const PAN_DOTS = 8;
const FONT = '13px "Share Tech Mono", ui-monospace, monospace';

/** Props of {@link WorldMap}. */
export interface WorldMapProps {
  onQuit: () => void;
}

/** The map's size in character cells, from the space it gets. */
function useCells(element: HTMLElement | null) {
  const [cells, setCells] = useState({ cols: 60, rows: 18 });
  useEffect(() => {
    if (element === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setCells({
        cols: Math.max(20, Math.floor(width / CELL_WIDTH)),
        rows: Math.max(8, Math.floor((height - STATUS_HEIGHT) / CELL_HEIGHT)),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return cells;
}

/** Draws a frame: phosphor dots, dimmer borders, labels and the marker. */
function draw(
  canvas: HTMLCanvasElement,
  frame: MapFrame,
  cols: number,
  markerOn: boolean,
) {
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  const width = cols * 2;
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < frame.dots.length; index++) {
    const dot = frame.dots[index];
    if (dot === 0) {
      continue;
    }
    context.fillStyle = dot === 1 ? "#33ff66" : "#1d9a3f";
    const x = (index % width) * (CELL_WIDTH / 2);
    const y = Math.floor(index / width) * (CELL_HEIGHT / 4);
    context.fillRect(x + 1, y + 1, 2, 2);
  }
  context.font = FONT;
  context.textBaseline = "top";
  for (const label of frame.labels) {
    context.fillStyle = "#b8f5c8";
    context.fillText(
      label.text,
      label.col * CELL_WIDTH,
      label.row * CELL_HEIGHT + 2,
    );
  }
  if (frame.marker && markerOn) {
    context.fillStyle = "#ffb000";
    context.beginPath();
    context.arc(
      frame.marker.col * CELL_WIDTH + CELL_WIDTH / 2,
      frame.marker.row * CELL_HEIGHT + CELL_HEIGHT / 2,
      4,
      0,
      2 * Math.PI,
    );
    context.fill();
  }
}

/**
 * `map`: an explorable world map in the style of MapSCII, drawn as phosphor
 * dots (2 × 4 per character cell, like braille) with coastlines, dotted
 * borders, labels by zoom and a blinking rack-01 marker. Arrow keys or WASD
 * pan, + and - zoom, dragging pans and the wheel zooms; q, Escape or Ctrl+C
 * quit. The world data is loaded when the map opens.
 */
export default function WorldMap({ onQuit }: WorldMapProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [world, setWorld] = useState<World | "loading" | "failed">("loading");
  const [view, setView] = useState(WORLD_VIEW);
  const [mouse, setMouse] = useState<{ lon: number; lat: number }>();
  const [area, setArea] = useState<HTMLDivElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<{ x: number; y: number } | undefined>(undefined);
  const { cols, rows } = useCells(area);
  const blink = useElapsed(500, reducedMotion);
  useEffect(() => {
    let current = true;
    fetch(`${import.meta.env.BASE_URL}map/world.json`)
      .then((response) => (response.ok ? response.json() : undefined))
      .then((json: unknown) => {
        if (current) {
          setWorld(parseWorld(json) ?? "failed");
        }
      })
      .catch(() => {
        if (current) {
          setWorld("failed");
        }
      });
    return () => {
      current = false;
    };
  }, []);
  const frame =
    typeof world === "object" ? rasterize(view, cols, rows, world) : undefined;
  useEffect(() => {
    if (canvas.current && frame) {
      draw(canvas.current, frame, cols, Math.floor(blink / 500) % 2 === 0);
    }
  });
  const move = (dx: number, dy: number) =>
    setView((current) => pan(current, dx, dy, cols, rows));
  const dotAt = (event: PointerEvent<HTMLCanvasElement>) =>
    screenToDot(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
      event.currentTarget.width,
      event.currentTarget.height,
      CELL_WIDTH,
      CELL_HEIGHT,
    );
  const keys: Record<string, () => void> = {
    ArrowLeft: () => move(-PAN_DOTS, 0),
    ArrowRight: () => move(PAN_DOTS, 0),
    ArrowUp: () => move(0, -PAN_DOTS),
    ArrowDown: () => move(0, PAN_DOTS),
    a: () => move(-PAN_DOTS, 0),
    d: () => move(PAN_DOTS, 0),
    w: () => move(0, -PAN_DOTS),
    s: () => move(0, PAN_DOTS),
    "+": () => setView((current) => zoomBy(current, 2)),
    "=": () => setView((current) => zoomBy(current, 2)),
    "-": () => setView((current) => zoomBy(current, 0.5)),
  };
  return (
    <ProgramScreen
      label="world map"
      columns={60}
      onQuit={onQuit}
      onKey={(event) => {
        const action = keys[event.key];
        action?.();
        return action !== undefined;
      }}
    >
      <div ref={setArea} className="crt-map">
        {world === "loading" ? <p>loading the world ...</p> : null}
        {world === "failed" ? <p>map: cannot load the world data</p> : null}
        {frame ? (
          <canvas
            ref={canvas}
            width={cols * CELL_WIDTH}
            height={rows * CELL_HEIGHT}
            aria-hidden="true"
            onPointerDown={(event) => {
              dragging.current = dotAt(event);
            }}
            onPointerUp={() => {
              dragging.current = undefined;
            }}
            onPointerLeave={() => {
              dragging.current = undefined;
              setMouse(undefined);
            }}
            onPointerMove={(event) => {
              const dot = dotAt(event);
              const [lon, lat] = fromDot(view, cols, rows, dot.x, dot.y);
              setMouse({ lon, lat });
              if (dragging.current) {
                move(dragging.current.x - dot.x, dragging.current.y - dot.y);
                dragging.current = dot;
              }
            }}
            onWheel={(event) =>
              setView((current) => zoomBy(current, event.deltaY < 0 ? 2 : 0.5))
            }
          />
        ) : null}
        <p className="crt-map-status">{statusLine(view, mouse)}</p>
        <p className="sr-only" aria-live="polite">
          {frame
            ? mapSummary(
                view,
                frame.labels.map((label) => label.text),
              )
            : ""}
        </p>
        <p className="text-phosphor-dim">
          arrows pan, +/- zoom, drag and wheel too, q quits. rack-01 hides
          somewhere in Night City.
        </p>
      </div>
    </ProgramScreen>
  );
}
