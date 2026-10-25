import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Builds `public/map/world.json` for the `map` command from Natural Earth's
 * 1:110m GeoJSON (public domain): land outlines, country outlines, country
 * label points and populated places, with coordinates rounded to 0.1° and
 * stored as integers. Usage:
 * `node scripts/build-map.ts <folder with the three ne_110m_*.geojson files>`.
 */

interface Feature {
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

const folder = process.argv[2];
if (folder === undefined) {
  console.error("usage: node scripts/build-map.ts <natural earth folder>");
  process.exit(1);
}

const read = (name: string): Feature[] =>
  (
    JSON.parse(readFileSync(join(folder, `${name}.geojson`), "utf8")) as {
      features: Feature[];
    }
  ).features;

const tenth = (value: number) => Math.round(value * 10);

/** The rings of a (multi)polygon as flat integer arrays [lon, lat, ...]. */
function rings(geometry: Feature["geometry"]): number[][] {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as number[][][]]
      : (geometry.coordinates as number[][][][]);
  return polygons.flatMap((polygon) =>
    polygon.map((ring) => {
      const flat: number[] = [];
      for (const [lon, lat] of ring) {
        const x = tenth(lon);
        const y = tenth(lat);
        if (flat.at(-2) !== x || flat.at(-1) !== y) {
          flat.push(x, y);
        }
      }
      return flat;
    }),
  );
}

const countries = read("ne_110m_admin_0_countries");
const world = {
  source: "Natural Earth 1:110m (public domain), naturalearthdata.com",
  land: read("ne_110m_land").flatMap((feature) => rings(feature.geometry)),
  borders: countries.flatMap((feature) => rings(feature.geometry)),
  countries: countries.map((feature) => [
    String(feature.properties.NAME),
    tenth(Number(feature.properties.LABEL_X)),
    tenth(Number(feature.properties.LABEL_Y)),
    Number(feature.properties.MIN_LABEL),
  ]),
  cities: read("ne_110m_populated_places_simple").map((feature) => {
    const [lon, lat] = feature.geometry.coordinates as number[];
    return [
      String(feature.properties.name),
      tenth(lon),
      tenth(lat),
      Number(feature.properties.scalerank),
    ];
  }),
};

const output = join("public", "map", "world.json");
writeFileSync(output, JSON.stringify(world));
console.log(
  `${output}: ${(JSON.stringify(world).length / 1000).toFixed(1)} kB`,
);
