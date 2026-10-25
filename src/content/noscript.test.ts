import { describe, expect, it } from "vitest";
import { friends } from "./friends";
import { noscriptHtml } from "./noscript";
import { projects } from "./projects";

describe("noscriptHtml", () => {
  const html = noscriptHtml();

  it("lists every project with its tagline and repository link", () => {
    for (const project of projects) {
      expect(html).toContain(`<a href="${project.repository}">`);
      expect(html).toContain(project.title);
      expect(html).toContain(project.tagline);
    }
  });

  it("links the friends' sites", () => {
    for (const friend of friends) {
      expect(html).toContain(`<a href="${friend.url}">${friend.site}</a>`);
    }
  });

  it("escapes text so content can never inject markup", () => {
    expect(
      noscriptHtml([
        {
          ...projects[0],
          title: `<script>alert("x")</script>`,
          tagline: "a & b",
        },
      ]),
    ).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(noscriptHtml([{ ...projects[0], tagline: "a & b" }])).toContain(
      "a &amp; b",
    );
  });
});
