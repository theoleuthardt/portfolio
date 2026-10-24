import { Color } from "three";

/** Scene colours from the design tokens, as Three.js colours. */
export const palette = {
  haze: new Color("#041a0b"),
  neon: new Color("#4dff88"),
  ceiling: new Color("#d4ffdc"),
  alert: new Color("#ff3b3b"),
  metal: new Color("#1b2421"),
  darkMetal: new Color("#0b110f"),
  tile: new Color("#0a1512"),
} as const;

/** A colour pushed beyond 1 so bloom picks it up; use with `toneMapped={false}`. */
export function glow(color: Color, strength: number): Color {
  return color.clone().multiplyScalar(strength);
}
