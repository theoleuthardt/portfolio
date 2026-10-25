import { describe, expect, it } from "vitest";
import { expandWord, parseLine, type Step } from "./shell";

const env = { HOME: "/home/guest", USER: "guest", EMPTY: "" };

/** The steps with every word expanded, for readable expectations. */
function words(input: string, status = 0) {
  const parsed = parseLine(input);
  if ("error" in parsed) {
    return parsed;
  }
  return parsed.map((step: Step) => ({
    commands: step.pipeline.map((command) =>
      command.map((word) => expandWord(word, env, status)),
    ),
    ...(step.then ? { then: step.then } : {}),
  }));
}

describe("parseLine", () => {
  it("splits a simple command into words", () => {
    expect(words("ls -l  projects")).toEqual([
      { commands: [["ls", "-l", "projects"]] },
    ]);
  });

  it("keeps quoted text together and drops the quotes", () => {
    expect(words(`echo "big world" 'single quoted' mi"x"ed`)).toEqual([
      { commands: [["echo", "big world", "single quoted", "mixed"]] },
    ]);
  });

  it("splits pipelines and command lists, also without spaces", () => {
    expect(words("ls|wc -l && echo ok;pwd || echo no")).toEqual([
      { commands: [["ls"], ["wc", "-l"]], then: "&&" },
      { commands: [["echo", "ok"]], then: ";" },
      { commands: [["pwd"]], then: "||" },
      { commands: [["echo", "no"]] },
    ]);
  });

  it("allows a trailing semicolon and returns nothing for blank input", () => {
    expect(words("pwd;")).toEqual([{ commands: [["pwd"]], then: ";" }]);
    expect(words("   ")).toEqual([]);
  });

  it("reports syntax errors like bash", () => {
    expect(words("ls |")).toEqual({
      error: "bash: syntax error near unexpected token `newline'",
    });
    expect(words("| wc")).toEqual({
      error: "bash: syntax error near unexpected token `|'",
    });
    expect(words("ls && && pwd")).toEqual({
      error: "bash: syntax error near unexpected token `&&'",
    });
    expect(words(`echo "open`)).toEqual({
      error: "bash: unexpected EOF while looking for matching `\"'",
    });
  });
});

describe("expandWord", () => {
  it("expands variables, braces and the last status", () => {
    expect(words("echo $HOME ${USER}x $? $NOPE.")).toEqual([
      { commands: [["echo", "/home/guest", "guestx", "0", "."]] },
    ]);
    expect(words("echo $?", 127)).toEqual([{ commands: [["echo", "127"]] }]);
  });

  it("expands inside double quotes but not inside single quotes", () => {
    expect(words(`echo "$USER" '$USER'`)).toEqual([
      { commands: [["echo", "guest", "$USER"]] },
    ]);
  });

  it("keeps a lone dollar sign and backslash-escaped characters", () => {
    expect(words("echo 5$ \\$HOME a\\ b")).toEqual([
      { commands: [["echo", "5$", "$HOME", "a b"]] },
    ]);
  });
});
