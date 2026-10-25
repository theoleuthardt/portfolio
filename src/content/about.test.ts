import { describe, expect, it } from "vitest";
import { about, contacts } from "./about";

describe("about", () => {
  it("says who Theo is in non-empty paragraphs", () => {
    expect(about.name).toBe("Theo Leuthardt");
    expect(about.role.length).toBeGreaterThan(0);
    expect(about.paragraphs.length).toBeGreaterThan(0);
    for (const paragraph of about.paragraphs) {
      expect(paragraph.trim().length).toBeGreaterThan(20);
    }
  });
});

describe("contacts", () => {
  it("links GitHub and LinkedIn over https with unique ids", () => {
    expect(contacts.map((contact) => contact.id)).toEqual([
      "github",
      "linkedin",
    ]);
    for (const contact of contacts) {
      expect(new URL(contact.url).protocol).toBe("https:");
      expect(contact.label.length).toBeGreaterThan(0);
    }
  });

  it("carries no tracking parameters", () => {
    for (const contact of contacts) {
      expect(new URL(contact.url).search).toBe("");
    }
  });
});
