import { describe, expect, it } from "vitest";
import { findFriend, friends } from "./friends";

describe("friends", () => {
  it("lists Domi's DomiFolio", () => {
    expect(friends.map((friend) => friend.id)).toEqual(["domifolio"]);
    expect(findFriend("domifolio")?.url).toBe("https://diewilhelms.de/");
  });

  it("links only https sites", () => {
    for (const friend of friends) {
      expect(friend.url).toMatch(/^https:\/\/\S+$/);
    }
  });

  it("finds a friend by id or by name, ignoring case", () => {
    expect(findFriend("DomiFolio")?.id).toBe("domifolio");
    expect(findFriend("domi")?.id).toBe("domifolio");
    expect(findFriend("nobody")).toBeUndefined();
  });
});
