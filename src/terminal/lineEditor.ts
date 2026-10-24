/** The input line and the cursor position in it. */
export interface Line {
  text: string;
  cursor: number;
}

/** Ctrl+U: deletes everything before the cursor. */
export function killToStart({ text, cursor }: Line): Line {
  return { text: text.slice(cursor), cursor: 0 };
}

/** Ctrl+K: deletes everything from the cursor to the end. */
export function killToEnd({ text, cursor }: Line): Line {
  return { text: text.slice(0, cursor), cursor };
}

/** Ctrl+W: deletes the word before the cursor, with the spaces after it. */
export function deleteWordBefore({ text, cursor }: Line): Line {
  const before = text.slice(0, cursor);
  const start = before.replace(/\S+\s*$/, "").length;
  return { text: text.slice(0, start) + text.slice(cursor), cursor: start };
}
