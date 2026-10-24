/** The PBR surfaces in `public/textures/` (CC0, see docs/ASSETS.md). */
export type Surface = "floor" | "wall" | "grating" | "concrete";

/**
 * URLs of a surface's colour, normal and packed roughness (green) /
 * metalness (blue) maps.
 */
export function surfaceUrls(
  surface: Surface,
  base: string,
): [string, string, string] {
  const prefix = `${base}textures/${surface}`;
  return [`${prefix}_color.webp`, `${prefix}_normal.webp`, `${prefix}_rm.webp`];
}
