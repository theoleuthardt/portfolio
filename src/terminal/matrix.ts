const GLYPHS = "0123456789<>/\\|=+*:.$#@%&?{}[]";
const TRAIL = 7;

function noise(seed: number, step: number): number {
  const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * One frame of the digital rain, `ms` after it started: every column is a
 * stream with its own speed and offset whose head falls down the screen
 * with a fading trail of glyphs behind it.
 */
export function matrixFrame(
  columns: number,
  rows: number,
  ms: number,
): string[] {
  const seconds = ms / 1000;
  const step = Math.floor(ms / 120);
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => {
      const speed = 6 + noise(column, 1) * 10;
      const loop = rows + TRAIL + Math.floor(noise(column, 2) * rows);
      const head = (seconds * speed + noise(column, 3) * loop) % loop;
      const behind = head - row;
      return behind >= 0 && behind < TRAIL
        ? GLYPHS[Math.floor(noise(column * 31 + row, step) * GLYPHS.length)]
        : " ";
    }).join(""),
  );
}
