/** A piece of a word: literal text, or a variable expanded when it runs. */
export type Part = { text: string } | { variable: string };

/** A word of a command line, expanded just before its command runs. */
export type Word = readonly Part[];

/** Commands joined by pipes; each command is a list of words. */
export type Pipeline = readonly (readonly Word[])[];

/** How a step continues: always, only after success, only after failure. */
export type Connector = ";" | "&&" | "||";

/** One pipeline of a command line and how the line continues after it. */
export interface Step {
  pipeline: Pipeline;
  then?: Connector;
}

type Operator = "|" | Connector;
type Token = { word: Part[] } | { operator: Operator };

const OPERATORS: readonly Operator[] = ["&&", "||", "|", ";"];
const VARIABLE = /^(\?|[A-Za-z_][A-Za-z0-9_]*)/;

function readVariable(
  input: string,
  at: number,
): { part: Part; length: number } {
  const braced = /^\{(\?|[A-Za-z_][A-Za-z0-9_]*)\}/.exec(input.slice(at + 1));
  if (braced) {
    return { part: { variable: braced[1] }, length: braced[0].length + 1 };
  }
  const plain = VARIABLE.exec(input.slice(at + 1));
  if (plain) {
    return { part: { variable: plain[1] }, length: plain[0].length + 1 };
  }
  return { part: { text: "$" }, length: 1 };
}

/** Splits a line into words and operators, honouring quotes and escapes. */
function tokenize(input: string): Token[] | { error: string } {
  const tokens: Token[] = [];
  let word: Part[] | undefined;
  let quote: "'" | '"' | undefined;
  const push = (part: Part) => {
    word ??= [];
    word.push(part);
  };
  const end = () => {
    if (word !== undefined) {
      tokens.push({ word });
      word = undefined;
    }
  };
  for (let at = 0; at < input.length;) {
    const char = input[at];
    if (quote === "'") {
      if (char === "'") {
        quote = undefined;
      } else {
        push({ text: char });
      }
      at += 1;
    } else if (char === "\\" && at + 1 < input.length) {
      push({ text: input[at + 1] });
      at += 2;
    } else if (char === "$") {
      const { part, length } = readVariable(input, at);
      push(part);
      at += length;
    } else if (quote === '"') {
      if (char === '"') {
        quote = undefined;
      } else {
        push({ text: char });
      }
      at += 1;
    } else if (char === "'" || char === '"') {
      quote = char;
      word ??= [];
      at += 1;
    } else if (/\s/.test(char)) {
      end();
      at += 1;
    } else {
      const operator = OPERATORS.find((op) => input.startsWith(op, at));
      if (operator) {
        end();
        tokens.push({ operator });
        at += operator.length;
      } else {
        push({ text: char });
        at += 1;
      }
    }
  }
  if (quote !== undefined) {
    return {
      error: `bash: unexpected EOF while looking for matching \`${quote}'`,
    };
  }
  end();
  return tokens;
}

const unexpected = (token: string) => ({
  error: `bash: syntax error near unexpected token \`${token}'`,
});

/**
 * Parses a command line like bash: words with single and double quotes and
 * backslash escapes, `$VAR`, `${VAR}` and `$?` (not inside single quotes),
 * pipelines with `|`, and lists with `;`, `&&` and `||`. Variables stay
 * unexpanded until {@link expandWord}, so earlier steps can set them.
 */
export function parseLine(input: string): Step[] | { error: string } {
  const tokens = tokenize(input);
  if ("error" in tokens) {
    return tokens;
  }
  const steps: Step[] = [];
  let pipeline: Word[][] = [];
  let command: Word[] = [];
  for (const token of tokens) {
    if ("word" in token) {
      command.push(token.word);
      continue;
    }
    if (command.length === 0) {
      return unexpected(token.operator);
    }
    pipeline.push(command);
    command = [];
    if (token.operator !== "|") {
      steps.push({ pipeline, then: token.operator });
      pipeline = [];
    }
  }
  if (command.length > 0) {
    pipeline.push(command);
    steps.push({ pipeline });
  } else if (
    pipeline.length > 0 ||
    steps[steps.length - 1]?.then === "&&" ||
    steps[steps.length - 1]?.then === "||"
  ) {
    return unexpected("newline");
  }
  return steps;
}

/** A word with its variables replaced; unset variables expand to nothing. */
export function expandWord(
  word: Word,
  env: Readonly<Record<string, string>>,
  status: number,
): string {
  return word
    .map((part) =>
      "text" in part
        ? part.text
        : part.variable === "?"
          ? String(status)
          : (env[part.variable] ?? ""),
    )
    .join("");
}
