/** Width of the keyboard's main block in key units (1u = one letter key). */
export const KEYBOARD_UNITS = 15;

/** One key: its row (0 = number row) and its centre and width in key units. */
export interface Key {
  row: number;
  x: number;
  width: number;
}

const ROWS: readonly (readonly number[])[] = [
  [...Array<number>(13).fill(1), 2],
  [1.5, ...Array<number>(12).fill(1), 1.5],
  [1.75, ...Array<number>(11).fill(1), 2.25],
  [2.25, ...Array<number>(10).fill(1), 2.75],
  [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
];

/** The keys of a classic ANSI main block, row by row from left to right. */
export function keyboardKeys(): Key[] {
  return ROWS.flatMap((widths, row) => {
    let edge = 0;
    return widths.map((width) => {
      const key = { row, x: edge + width / 2, width };
      edge += width;
      return key;
    });
  });
}

/** Width of the numeric keypad in key units. */
export const NUMPAD_UNITS = 4;

/** The keys of a numeric keypad: four columns of square keys in five rows. */
export function numpadKeys(): Key[] {
  return [0, 1, 2, 3, 4].flatMap((row) =>
    [0, 1, 2, 3].map((column) => ({ row, x: column + 0.5, width: 1 })),
  );
}
