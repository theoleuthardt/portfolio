import { describe, expect, it } from "vitest";
import html from "../index.html?raw";

const meta = (attribute: string, name: string) =>
  new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="([^"]+)"`).exec(
    html,
  )?.[1];
const ogImages = import.meta.glob("../public/og-image.jpg", {
  query: "?url",
  eager: true,
});

describe("index.html", () => {
  it("describes the page for search engines", () => {
    expect(meta("name", "description")?.length).toBeGreaterThan(60);
    expect(html).toContain(
      '<link rel="canonical" href="https://theocloud.dev/" />',
    );
  });

  it("has Open Graph and Twitter cards with an existing absolute image", () => {
    expect(meta("property", "og:title")).toBeTruthy();
    expect(meta("property", "og:description")).toBeTruthy();
    expect(meta("property", "og:url")).toBe("https://theocloud.dev/");
    const image = meta("property", "og:image");
    expect(image).toBe("https://theocloud.dev/og-image.jpg");
    expect(Object.keys(ogImages)).toHaveLength(1);
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
  });

  it("has a full title for clients without JavaScript", () => {
    expect(html).toContain(
      "<title>TheoCloud OS – Theo Leuthardt's portfolio</title>",
    );
  });

  it("keeps the theme colour and the language", () => {
    expect(meta("name", "theme-color")).toBe("#031008");
    expect(html).toContain('<html lang="en">');
  });
});
