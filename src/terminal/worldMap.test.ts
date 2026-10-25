import { describe, expect, it } from "vitest";
import {
  type MapView,
  NIGHT_CITY,
  WORLD_VIEW,
  fromDot,
  mapSummary,
  pan,
  parseWorld,
  rasterize,
  screenToDot,
  statusLine,
  toDot,
  zoomBy,
  type World,
} from "./worldMap";

const cols = 60;
const rows = 20;
const world: World = {
  land: [[-100, 0, 100, 0]],
  borders: [[0, -100, 0, 100]],
  countries: [
    ["Testland", 0, 0, 2],
    ["Faraway", 900, 100, 6],
  ],
  cities: [["Capital", 50, 50, 1]],
};

describe("toDot and fromDot", () => {
  it("puts the view centre in the middle of the dot grid", () => {
    const view: MapView = { lon: 10, lat: 20, zoom: 2 };
    const [x, y] = toDot(view, cols, rows, 10, 20);
    expect(x).toBeCloseTo(cols);
    expect(y).toBeCloseTo(rows * 2);
    const [lon, lat] = fromDot(view, cols, rows, x, y);
    expect(lon).toBeCloseTo(10);
    expect(lat).toBeCloseTo(20);
  });

  it("shows the whole world across the width at zoom 1", () => {
    const [left] = toDot(WORLD_VIEW, cols, rows, -180, 0);
    const [right] = toDot(WORLD_VIEW, cols, rows, 180, 0);
    expect(right - left).toBeCloseTo(cols * 2);
  });

  it("puts north up", () => {
    const [, north] = toDot(WORLD_VIEW, cols, rows, 0, 50);
    const [, south] = toDot(WORLD_VIEW, cols, rows, 0, -50);
    expect(north).toBeLessThan(south);
  });
});

describe("fromDot near the date line", () => {
  it("wraps the longitude into -180 to 180", () => {
    const view: MapView = { lon: 170, lat: 0, zoom: 1 };
    const [lon] = fromDot(view, cols, rows, cols * 2 - 1, rows * 2);
    expect(lon).toBeGreaterThanOrEqual(-180);
    expect(lon).toBeLessThan(180);
    expect(lon).toBeLessThan(0);
  });
});

describe("screenToDot", () => {
  it("converts a pointer position on a scaled canvas into dots", () => {
    const box = { left: 100, top: 50, width: 240, height: 160 };
    expect(screenToDot(100, 50, box, 480, 320, 8, 16)).toEqual({ x: 0, y: 0 });
    expect(screenToDot(340, 210, box, 480, 320, 8, 16)).toEqual({
      x: 120,
      y: 80,
    });
  });
});

describe("pan and zoomBy", () => {
  it("moves the centre by dots and wraps around the date line", () => {
    const east = pan({ lon: 170, lat: 0, zoom: 1 }, 10, 0, cols, rows);
    expect(east.lon).toBeLessThan(0);
    expect(east.lon).toBeGreaterThan(-180);
  });

  it("never moves the centre beyond 80 degrees north or south", () => {
    expect(pan(WORLD_VIEW, 0, -10000, cols, rows).lat).toBe(80);
    expect(pan(WORLD_VIEW, 0, 10000, cols, rows).lat).toBe(-80);
  });

  it("zooms within 1 and 64", () => {
    expect(zoomBy(WORLD_VIEW, 2).zoom).toBe(2);
    expect(zoomBy(WORLD_VIEW, 0.1).zoom).toBe(1);
    expect(zoomBy({ ...WORLD_VIEW, zoom: 50 }, 4).zoom).toBe(64);
  });
});

describe("rasterize", () => {
  const view: MapView = { lon: 0, lat: 0, zoom: 1 };
  const frame = rasterize(view, cols, rows, world);
  const at = (x: number, y: number) => frame.dots[y * cols * 2 + x];

  it("draws coastlines solid and borders dotted", () => {
    const [x0, y] = toDot(view, cols, rows, -10, 0).map(Math.round);
    const [x1] = toDot(view, cols, rows, 10, 0).map(Math.round);
    for (let x = x0; x <= x1; x++) {
      expect(at(x, y)).toBe(1);
    }
    const [bx, by0] = toDot(view, cols, rows, 0, 10).map(Math.round);
    const [, by1] = toDot(view, cols, rows, 0, -10).map(Math.round);
    const border = [];
    for (let y2 = by0; y2 <= by1; y2++) {
      if (y2 !== y) {
        border.push(at(bx, y2));
      }
    }
    expect(border).toContain(2);
    expect(border).toContain(0);
  });

  it("keeps long segments that cross the view when zoomed far in", () => {
    const long: World = { ...world, land: [[-200, 0, 200, 0]], borders: [] };
    const close = rasterize({ lon: 0, lat: 0, zoom: 64 }, cols, rows, long);
    const y = Math.round(
      toDot({ lon: 0, lat: 0, zoom: 64 }, cols, rows, 0, 0)[1],
    );
    const row = close.dots.slice(y * cols * 2, (y + 1) * cols * 2);
    expect([...row].every((dot) => dot === 1)).toBe(true);
  });

  it("labels the countries that fit the zoom and never overlaps labels", () => {
    expect(frame.labels.map((label) => label.text)).toContain("Testland");
    expect(frame.labels.map((label) => label.text)).not.toContain("Faraway");
    expect(frame.labels.map((label) => label.text)).not.toContain("Capital");
    const close = rasterize({ lon: 5, lat: 5, zoom: 16 }, cols, rows, world);
    expect(close.labels.map((label) => label.text)).toContain("Capital");
    const cells = new Set<string>();
    for (const label of close.labels) {
      for (let col = label.col; col < label.col + label.text.length; col++) {
        expect(cells.has(`${col},${label.row}`)).toBe(false);
        cells.add(`${col},${label.row}`);
      }
    }
  });

  it("marks rack-01 in Night City when it is in view", () => {
    const near = rasterize(
      { lon: NIGHT_CITY.lon, lat: NIGHT_CITY.lat, zoom: 8 },
      cols,
      rows,
      world,
    );
    expect(near.marker).toEqual({ col: cols / 2, row: rows / 2 });
    expect(near.labels.map((label) => label.text)).toContain(
      "rack-01 (Night City)",
    );
    expect(
      rasterize({ lon: 100, lat: 40, zoom: 8 }, cols, rows, world).marker,
    ).toBeUndefined();
  });
});

describe("statusLine and mapSummary", () => {
  it("shows the centre, the zoom and the pointer like MapSCII", () => {
    expect(statusLine({ lon: 13.4, lat: 52.5, zoom: 2 })).toBe(
      "center: 52.50, 13.40  zoom: 2",
    );
    expect(
      statusLine({ lon: 13.4, lat: 52.5, zoom: 2 }, { lon: -3.7, lat: 40.42 }),
    ).toBe("center: 52.50, 13.40  zoom: 2  mouse: 40.42, -3.70");
  });

  it("describes the view in words", () => {
    expect(
      mapSummary({ lon: 13.4, lat: 52.5, zoom: 2 }, ["Germany", "Poland"]),
    ).toBe(
      "World map centred on 52.5° N, 13.4° E at zoom 2, showing Germany, Poland.",
    );
  });
});

describe("parseWorld", () => {
  it("accepts the built world data and rejects anything else", () => {
    expect(parseWorld(world)).toEqual(world);
    expect(parseWorld({ land: "no" })).toBeUndefined();
    expect(parseWorld(null)).toBeUndefined();
  });
});
