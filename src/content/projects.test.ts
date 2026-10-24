import { describe, expect, it } from "vitest";
import { findProject, projects, RACK_UNITS } from "./projects";

const httpsUrl = /^https:\/\/\S+$/;

describe("projects", () => {
  it("lists exactly the chosen projects in rack order", () => {
    expect(projects.map((project) => project.id)).toEqual([
      "backlog-manager",
      "trust-issues",
      "flashi",
      "homelab-docker-compose",
      "claude-devcontainer",
      "opennutritracker",
      "dinogame",
    ]);
  });

  it("uses lowercase ids that can be typed in the terminal", () => {
    for (const project of projects) {
      expect(project.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every project a title, a short tagline, a summary and a stack", () => {
    for (const project of projects) {
      expect(project.title.trim()).not.toBe("");
      expect(project.tagline.trim()).not.toBe("");
      expect(project.tagline.length).toBeLessThanOrEqual(40);
      expect(project.summary.trim().length).toBeGreaterThan(80);
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("links every project to its https repository", () => {
    for (const project of projects) {
      expect(project.repository).toMatch(httpsUrl);
    }
  });

  it("links releases where the repository publishes them", () => {
    const withReleases = projects.filter(
      (project) => project.releases !== undefined,
    );
    expect(withReleases.map((project) => project.id)).toEqual([
      "backlog-manager",
      "trust-issues",
      "dinogame",
    ]);
    for (const project of withReleases) {
      expect(project.releases).toBe(`${project.repository}/releases`);
    }
  });

  it("links the container packages where the repository publishes them", () => {
    const withPackages = projects.filter(
      (project) => project.packages !== undefined,
    );
    expect(withPackages.map((project) => project.id)).toEqual([
      "backlog-manager",
      "trust-issues",
      "flashi",
      "claude-devcontainer",
    ]);
    for (const project of withPackages) {
      const name = project.repository.split("/").pop();
      expect(project.packages).toBe(
        `https://github.com/theoleuthardt?tab=packages&repo_name=${name}`,
      );
    }
  });

  it("links a website only as https", () => {
    for (const project of projects) {
      if (project.website !== undefined) {
        expect(project.website).toMatch(httpsUrl);
      }
    }
  });

  it("marks only OpenNutriTracker as a fork and names its upstream", () => {
    const forks = projects.filter((project) => project.fork !== undefined);
    expect(forks.map((project) => project.id)).toEqual(["opennutritracker"]);
    expect(forks[0].fork?.upstream).toBe(
      "https://github.com/simonoppowa/OpenNutriTracker",
    );
  });

  it("fits all modules into the rack", () => {
    const used = projects.reduce((sum, project) => sum + project.units, 0);
    expect(used).toBeLessThanOrEqual(RACK_UNITS);
  });
});

describe("findProject", () => {
  it("finds a project by id regardless of case", () => {
    expect(findProject("Trust-Issues")?.title).toBe("Trust Issues");
  });

  it("returns undefined for an unknown id", () => {
    expect(findProject("nope")).toBeUndefined();
  });
});
