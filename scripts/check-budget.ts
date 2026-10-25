import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { checkBudgets, type Manifest } from "./budget.ts";

const DIST = "dist";
const manifest = JSON.parse(
  readFileSync(join(DIST, ".vite", "manifest.json"), "utf8"),
) as Manifest;
const sizes = new Map(
  Object.values(manifest).map(({ file }) => [
    file,
    gzipSync(readFileSync(join(DIST, file))).length,
  ]),
);
const assetBytes = ["models", "textures"]
  .flatMap((folder) =>
    readdirSync(join(DIST, folder)).map(
      (name) => statSync(join(DIST, folder, name)).size,
    ),
  )
  .reduce((sum, size) => sum + size, 0);

const report = checkBudgets(manifest, sizes, assetBytes);
const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;
for (const row of report.rows) {
  console.log(
    `${row.ok ? "ok  " : "OVER"} ${row.name.padEnd(16)} ${kb(row.size).padStart(10)} of ${kb(row.limit)}`,
  );
}
if (!report.ok) {
  console.error("bundle budget exceeded, see docs/design-concept.md section 7");
  process.exit(1);
}
