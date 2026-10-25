/** One entry of Vite's build manifest. */
export interface ManifestChunk {
  file: string;
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
 * post-processing, props and the lab build-out.
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
];

/** A chunk and everything it imports statically, as manifest keys. */
function staticClosure(manifest: Manifest, key: string): Set<string> {
  const found = new Set<string>();
  const visit = (current: string) => {
    if (found.has(current) || manifest[current] === undefined) {
      return;
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
 * Checks each loading step against its limit: a step costs its chunk plus
 * every statically imported chunk that no earlier step has loaded yet, in
 * gzip bytes from `sizes` (keyed by output file). The static assets are
 * checked as a whole. An entry missing from the manifest throws, so a moved
 * chunk never slips through unchecked.
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
      if (!loaded.has(key)) {
        loaded.add(key);
        size += sizes.get(manifest[key].file) ?? 0;
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
