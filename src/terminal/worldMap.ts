/** A label point: name, longitude and latitude in tenths of a degree, rank. */
export type Place = readonly [string, number, number, number];

/**
 * The world data of `public/map/world.json`: land and country outlines as
 * flat integer rings `[lon, lat, lon, lat, ...]` in tenths of a degree,
 * country label points (rank = Natural Earth's MIN_LABEL) and cities (rank
 * = scalerank).
 */
export interface World {
  land: readonly (readonly number[])[];
  borders: readonly (readonly number[])[];
  countries: readonly Place[];
  cities: readonly Place[];
}

/** What the map shows: its centre and how far it is zoomed in. */
export interface MapView {
  lon: number;
  lat: number;
  zoom: number;
}

/** A label on the map, in character cells. */
export interface MapLabel {
  text: string;
  col: number;
  row: number;
}

/** One frame of the map: dots (0 none, 1 coast, 2 border), labels, marker. */
export interface MapFrame {
  dots: Uint8Array;
  labels: MapLabel[];
  marker?: { col: number; row: number };
}

/** The whole world, centred, as the map opens. */
export const WORLD_VIEW: MapView = { lon: 0, lat: 20, zoom: 1 };

/** Where rack-01 stands: Night City, on the coast of North California. */
export const NIGHT_CITY = { lon: -120.8, lat: 35.4 };

const MIN_ZOOM = 1;
const MAX_ZOOM = 64;
const MAX_LAT = 80;
const DOTS_X = 2;
const DOTS_Y = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Web Mercator: longitude and latitude to the unit square, north up. */
function mercator(lon: number, lat: number): [number, number] {
  const phi = (clamp(lat, -85, 85) * Math.PI) / 180;
  return [
    (lon + 180) / 360,
    (1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2,
  ];
}

function inverse(x: number, y: number): [number, number] {
  return [
    x * 360 - 180,
    (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI,
  ];
}

/** Dots per unit of the Mercator square, and the grid size in dots. */
function grid(view: MapView, cols: number, rows: number) {
  const width = cols * DOTS_X;
  const height = rows * DOTS_Y;
  return { width, height, scale: view.zoom * width };
}

/** Where a place lands on the dot grid of a `cols` × `rows` map. */
export function toDot(
  view: MapView,
  cols: number,
  rows: number,
  lon: number,
  lat: number,
): [number, number] {
  const { width, height, scale } = grid(view, cols, rows);
  const [cx, cy] = mercator(view.lon, view.lat);
  const [x, y] = mercator(lon, lat);
  return [(x - cx) * scale + width / 2, (y - cy) * scale + height / 2];
}

const wrap = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** The place under a dot of the grid, longitude wrapped to ±180°. */
export function fromDot(
  view: MapView,
  cols: number,
  rows: number,
  x: number,
  y: number,
): [number, number] {
  const { width, height, scale } = grid(view, cols, rows);
  const [cx, cy] = mercator(view.lon, view.lat);
  const [lon, lat] = inverse(
    (x - width / 2) / scale + cx,
    (y - height / 2) / scale + cy,
  );
  return [wrap(lon), lat];
}

/**
 * The view moved by `dx`/`dy` dots: longitude wraps around the date line,
 * the centre never goes beyond 80° north or south.
 */
export function pan(
  view: MapView,
  dx: number,
  dy: number,
  cols: number,
  rows: number,
): MapView {
  const { scale } = grid(view, cols, rows);
  const [cx, cy] = mercator(view.lon, view.lat);
  const [lon, lat] = inverse(cx + dx / scale, clamp(cy + dy / scale, 0, 1));
  return { ...view, lon: wrap(lon), lat: clamp(lat, -MAX_LAT, MAX_LAT) };
}

/**
 * The dot under a pointer at `clientX`/`clientY` on a canvas of
 * `canvasWidth` × `canvasHeight` pixels shown in `box` (it may be scaled),
 * with character cells of `cellWidth` × `cellHeight` canvas pixels.
 */
export function screenToDot(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number,
  cellWidth: number,
  cellHeight: number,
): { x: number; y: number } {
  const px = ((clientX - box.left) * canvasWidth) / box.width;
  const py = ((clientY - box.top) * canvasHeight) / box.height;
  return {
    x: (px / cellWidth) * DOTS_X,
    y: (py / cellHeight) * DOTS_Y,
  };
}

/** The view zoomed by `factor`, between 1 and 64. */
export function zoomBy(view: MapView, factor: number): MapView {
  return { ...view, zoom: clamp(view.zoom * factor, MIN_ZOOM, MAX_ZOOM) };
}

/**
 * Draws a line of dots with `value`; borders (2) leave every other dot out
 * and never cover a coastline dot.
 */
function line(
  dots: Uint8Array,
  width: number,
  height: number,
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  value: number,
) {
  const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  if (steps > width * 4) {
    return;
  }
  for (let step = 0; step <= steps; step++) {
    if (value === 2 && step % 2 === 1) {
      continue;
    }
    const t = steps === 0 ? 0 : step / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const index = y * width + x;
      if (value === 1 || dots[index] === 0) {
        dots[index] = value;
      }
    }
  }
}

function drawRings(
  dots: Uint8Array,
  view: MapView,
  cols: number,
  rows: number,
  rings: World["land"],
  value: number,
) {
  const { width, height, scale } = grid(view, cols, rows);
  for (const ring of rings) {
    for (let index = 2; index < ring.length; index += 2) {
      const from = [ring[index - 2] / 10, ring[index - 1] / 10];
      const to = [ring[index] / 10, ring[index + 1] / 10];
      if (Math.abs(to[0] - from[0]) > 180) {
        continue;
      }
      const a = toDot(view, cols, rows, from[0], from[1]);
      const b = toDot(view, cols, rows, to[0], to[1]);
      for (const copy of [-scale, 0, scale]) {
        const left = Math.min(a[0], b[0]) + copy;
        const right = Math.max(a[0], b[0]) + copy;
        const top = Math.min(a[1], b[1]);
        const bottom = Math.max(a[1], b[1]);
        if (right >= 0 && left < width && bottom >= 0 && top < height) {
          line(
            dots,
            width,
            height,
            [a[0] + copy, a[1]],
            [b[0] + copy, b[1]],
            value,
          );
        }
      }
    }
  }
}

/** The cell of a place, or `undefined` outside the map. */
function cellOf(
  view: MapView,
  cols: number,
  rows: number,
  lon: number,
  lat: number,
): { col: number; row: number } | undefined {
  const { scale } = grid(view, cols, rows);
  const [x, y] = toDot(view, cols, rows, lon, lat);
  for (const copy of [0, -scale, scale]) {
    const col = Math.floor((x + copy) / DOTS_X);
    const row = Math.floor(y / DOTS_Y);
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      return { col, row };
    }
  }
  return undefined;
}

/**
 * One frame of the map for a `cols` × `rows` character screen: coastlines
 * as solid dots, country borders dotted (2 × 4 dots per cell, like braille),
 * the rack-01 marker, and labels by zoom (the big countries first, more
 * countries and then cities as it zooms in), never overlapping.
 */
export function rasterize(
  view: MapView,
  cols: number,
  rows: number,
  world: World,
): MapFrame {
  const { width, height } = grid(view, cols, rows);
  const dots = new Uint8Array(width * height);
  drawRings(dots, view, cols, rows, world.borders, 2);
  drawRings(dots, view, cols, rows, world.land, 1);
  const level = Math.log2(view.zoom);
  const taken = new Set<string>();
  const labels: MapLabel[] = [];
  const place = (text: string, col: number, row: number) => {
    const cells = Array.from(
      { length: text.length },
      (_, i) => `${col + i},${row}`,
    );
    if (
      col < 0 ||
      col + text.length > cols ||
      cells.some((cell) => taken.has(cell))
    ) {
      return;
    }
    cells.forEach((cell) => taken.add(cell));
    labels.push({ text, col, row });
  };
  const marker = cellOf(view, cols, rows, NIGHT_CITY.lon, NIGHT_CITY.lat);
  if (marker) {
    place("rack-01 (Night City)", marker.col + 2, marker.row);
  }
  for (const [name, lon, lat, rank] of [...world.countries].sort(
    (a, b) => a[3] - b[3],
  )) {
    const cell = cellOf(view, cols, rows, lon / 10, lat / 10);
    if (cell && rank <= 2.5 + level * 1.5) {
      place(name, cell.col - Math.floor(name.length / 2), cell.row);
    }
  }
  for (const [name, lon, lat, rank] of [...world.cities].sort(
    (a, b) => a[3] - b[3],
  )) {
    const cell = cellOf(view, cols, rows, lon / 10, lat / 10);
    if (cell && level >= 2 && rank <= (level - 1.5) * 2.5) {
      place(name, cell.col + 1, cell.row);
    }
  }
  return marker ? { dots, labels, marker } : { dots, labels };
}

const fixed = (value: number) => value.toFixed(2);

/** The status line under the map, like MapSCII's. */
export function statusLine(
  view: MapView,
  mouse?: { lon: number; lat: number },
): string {
  const zoom = Number(view.zoom.toFixed(2));
  const centre = `center: ${fixed(view.lat)}, ${fixed(view.lon)}  zoom: ${zoom}`;
  return mouse
    ? `${centre}  mouse: ${fixed(mouse.lat)}, ${fixed(mouse.lon)}`
    : centre;
}

/** The view in words, for screen readers. */
export function mapSummary(view: MapView, names: readonly string[]): string {
  const lat = `${Math.abs(view.lat).toFixed(1)}° ${view.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(view.lon).toFixed(1)}° ${view.lon >= 0 ? "E" : "W"}`;
  const zoom = Number(view.zoom.toFixed(2));
  const showing = names.length > 0 ? names.join(", ") : "open sea";
  return `World map centred on ${lat}, ${lon} at zoom ${zoom}, showing ${showing}.`;
}

const isRings = (value: unknown): value is number[][] =>
  Array.isArray(value) &&
  value.every(
    (ring) =>
      Array.isArray(ring) && ring.every((item) => typeof item === "number"),
  );

const isPlaces = (value: unknown): value is Place[] =>
  Array.isArray(value) &&
  value.every(
    (place) =>
      Array.isArray(place) &&
      place.length === 4 &&
      typeof place[0] === "string" &&
      place.slice(1).every((item) => typeof item === "number"),
  );

/** The world data from `world.json`, or `undefined` if it is not valid. */
export function parseWorld(json: unknown): World | undefined {
  if (typeof json !== "object" || json === null) {
    return undefined;
  }
  const { land, borders, countries, cities } = json as Record<string, unknown>;
  return isRings(land) &&
    isRings(borders) &&
    isPlaces(countries) &&
    isPlaces(cities)
    ? { land, borders, countries, cities }
    : undefined;
}
