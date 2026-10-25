/** One entry of Vite's build manifest. */
export interface ManifestChunk {
  file: string;
  css?: string[];
  isEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}

/** Vite's build manifest (`dist/.vite/manifest.json`), keyed by source. */
export type Manifest = Readonly<Record<string, ManifestChunk>>;

/** The most a loading step may add, in bytes after gzip. */
export interface Budget {
  name: string;
  /** Manifest key of the chunk that starts the step. */
  entry: string;
  limit: number;
}

/** One line of the budget report. */
export interface BudgetRow {
  name: string;
  size: number;
  limit: number;
  ok: boolean;
}

/** Limit of the static 3D assets (models and textures), in bytes. */
export const ASSET_LIMIT = 3_000_000;

/**
 * The loading steps of `docs/design-concept.md` section 7, in load order:
 * the main bundle, the scene with the shared three/fiber/drei chunk, then
 * post-processing, props, the lab build-out, the desk terminal (only
 * loaded from 1024 px) and the world map (only loaded by `map`).
 */
export const BUDGETS: readonly Budget[] = [
  { name: "main", entry: "index.html", limit: 110_000 },
  { name: "scene", entry: "src/scene/Scene.tsx", limit: 280_000 },
  {
    name: "post-processing",
    entry: "src/scene/PostEffects.tsx",
    limit: 120_000,
  },
  { name: "props", entry: "src/scene/props/Props.tsx", limit: 40_000 },
  { name: "lab", entry: "src/scene/lab/Lab.tsx", limit: 20_000 },
  { name: "desk", entry: "src/scene/monitor/CrtMonitor.tsx", limit: 30_000 },
  { name: "map", entry: "src/ui/WorldMap.tsx", limit: 15_000 },
];

/** A chunk and everything it imports statically, as manifest keys. */
function staticClosure(manifest: Manifest, key: string): Set<string> {
  const found = new Set<string>();
  const visit = (current: string) => {
    if (found.has(current)) {
      return;
    }
    if (manifest[current] === undefined) {
      throw new Error(`"${current}" is imported but not in the manifest`);
    }
    found.add(current);
    for (const imported of manifest[current].imports ?? []) {
      visit(imported);
    }
  };
  visit(key);
  return found;
}

/**
 * Checks each loading step against its limit: a step costs every output
 * file (scripts and stylesheets) of its chunk and of the chunks it imports
 * statically that no earlier step has loaded yet, in gzip bytes from
 * `sizes`; a file shared by several chunks counts once. The static assets
 * are checked as a whole. An entry or import missing from the manifest, or
 * an output without a size, throws, so nothing slips through unchecked.
 */
export function checkBudgets(
  manifest: Manifest,
  sizes: ReadonlyMap<string, number>,
  assetBytes: number,
  budgets: readonly Budget[] = BUDGETS,
): { rows: BudgetRow[]; ok: boolean } {
  const loaded = new Set<string>();
  const rows: BudgetRow[] = budgets.map(({ name, entry, limit }) => {
    if (manifest[entry] === undefined) {
      throw new Error(`budget "${name}": "${entry}" is not in the manifest`);
    }
    let size = 0;
    for (const key of staticClosure(manifest, entry)) {
      const { file, css = [] } = manifest[key];
      for (const output of [file, ...css]) {
        if (!loaded.has(output)) {
          loaded.add(output);
          const bytes = sizes.get(output);
          if (bytes === undefined) {
            throw new Error(`no size for "${output}"`);
          }
          size += bytes;
        }
      }
    }
    return { name, size, limit, ok: size <= limit };
  });
  rows.push({
    name: "assets",
    size: assetBytes,
    limit: ASSET_LIMIT,
    ok: assetBytes <= ASSET_LIMIT,
  });
  return { rows, ok: rows.every((row) => row.ok) };
}
