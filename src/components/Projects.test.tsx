import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { projects } from "../constants";
import { Projects } from "./Projects";

describe("Projects", () => {
  it("renders one link per project pointing to its page", () => {
    render(<Projects projectsRef={createRef<HTMLDivElement>()} />);

    for (const project of projects) {
      expect(screen.getByRole("link", { name: project.title })).toHaveAttribute(
        "href",
        project.link,
      );
    }
  });
});
