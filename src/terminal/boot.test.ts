import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { bootSteps, OS_NAME, progressBar } from "./boot";

describe("progressBar", () => {
  it("draws an empty and a full bar", () => {
    expect(progressBar(0)).toBe("[░░░░░░░░░░░░░░░░░░░░]   0%");
    expect(progressBar(100)).toBe("[████████████████████] 100%");
  });

  it("fills cells in proportion and pads the percentage", () => {
    expect(progressBar(61)).toBe("[████████████░░░░░░░░]  61%");
  });

  it("clamps values outside 0 to 100", () => {
    expect(progressBar(-5)).toBe(progressBar(0));
    expect(progressBar(140)).toBe(progressBar(100));
  });
});

describe("bootSteps", () => {
  it("counts up to 100 percent", () => {
    const percents = bootSteps.map((step) => step.percent);
    expect(percents).toEqual([...percents].sort((a, b) => a - b));
    expect(percents[percents.length - 1]).toBe(100);
  });

  it("mounts every project", () => {
    expect(bootSteps.map((step) => step.label)).toContain(
      `mounting /projects (${projects.length} modules)`,
    );
  });
});

describe("OS_NAME", () => {
  it("is TheoCloud OS", () => {
    expect(OS_NAME).toBe("TheoCloud OS");
  });
});
