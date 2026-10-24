import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project } from "../content/projects";
import { ProjectScreen } from "./ProjectScreen";

const bare: Project = {
  id: "demo",
  title: "Demo",
  tagline: "A demo project",
  summary: "A demo project used to test which links the project screen shows.",
  stack: ["TypeScript"],
  repository: "https://github.com/theoleuthardt/demo",
  units: 1,
};

const linkNames = () =>
  screen.getAllByRole("link").map((link) => link.textContent);

describe("ProjectScreen links", () => {
  it("shows only the repository when nothing else is published", () => {
    render(<ProjectScreen project={bare} />);
    expect(linkNames()).toEqual(["> repository ↗"]);
  });

  it("adds website, releases and packages when they exist", () => {
    render(
      <ProjectScreen
        project={{
          ...bare,
          website: "https://demo.example",
          releases: "https://github.com/theoleuthardt/demo/releases",
          packages:
            "https://github.com/theoleuthardt?tab=packages&repo_name=demo",
        }}
      />,
    );
    expect(linkNames()).toEqual([
      "> repository ↗",
      "> website ↗",
      "> releases ↗",
      "> packages ↗",
    ]);
    expect(screen.getByRole("link", { name: /releases/ })).toHaveAttribute(
      "href",
      "https://github.com/theoleuthardt/demo/releases",
    );
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
