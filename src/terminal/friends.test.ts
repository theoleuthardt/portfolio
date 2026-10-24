import { describe, expect, it } from "vitest";
import { commandNames, run, type CommandContext } from "./commands";
import { complete } from "./complete";

const home: CommandContext = { history: [] };

describe("friends", () => {
  it("lists the befriended sites with a link", () => {
    const { lines } = run("friends", home);
    expect(lines).toContainEqual({
      kind: "link",
      label: "DomiFolio",
      url: "https://diewilhelms.de/",
    });
  });
});

describe("domi", () => {
  it("tells who Domi is and offers to open the site", () => {
    const { lines } = run("domi", home);
    expect(lines).toContainEqual({
      kind: "link",
      label: "DomiFolio",
      url: "https://diewilhelms.de/",
    });
    expect(lines).toContainEqual({
      kind: "chips",
      commands: ["open domifolio"],
    });
  });
});

describe("open with a friend's site", () => {
  it("visits the site instead of ejecting a module", () => {
    for (const input of ["open domifolio", "open domi", "open DomiFolio"]) {
      const result = run(input, home);
      expect(result.action).toEqual({
        type: "visit",
        url: "https://diewilhelms.de/",
      });
      expect(result.lines[0]).toEqual({
        kind: "muted",
        text: "> opening DomiFolio in a new tab ...",
      });
    }
  });

  it("completes the site after open", () => {
    expect(
      complete("open dom", commandNames, [], "~", ["domifolio"]).input,
    ).toBe("open domifolio");
  });

  it("has manual pages for the new commands", () => {
    expect(run("man friends", home).lines[0]).toEqual({
      kind: "text",
      text: "NAME",
    });
    expect(run("man domi", home).lines[0]).toEqual({
      kind: "text",
      text: "NAME",
    });
  });
});
