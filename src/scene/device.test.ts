import { describe, expect, it } from "vitest";
import { isPhoneViewport, supportsWebGL } from "./device";

describe("isPhoneViewport", () => {
  it("treats narrow viewports as phones", () => {
    expect(
      isPhoneViewport({ width: 390, height: 844, coarsePointer: true }),
    ).toBe(true);
    expect(
      isPhoneViewport({ width: 639, height: 900, coarsePointer: false }),
    ).toBe(true);
  });

  it("treats a phone in landscape as a phone", () => {
    expect(
      isPhoneViewport({ width: 844, height: 390, coarsePointer: true }),
    ).toBe(true);
  });

  it("treats tablets and desktops as wide screens", () => {
    expect(
      isPhoneViewport({ width: 1024, height: 768, coarsePointer: true }),
    ).toBe(false);
    expect(
      isPhoneViewport({ width: 1280, height: 480, coarsePointer: false }),
    ).toBe(false);
    expect(
      isPhoneViewport({ width: 640, height: 900, coarsePointer: false }),
    ).toBe(false);
  });
});

describe("supportsWebGL", () => {
  const canvasWith = (contexts: Record<string, unknown>) => () =>
    ({
      getContext: (name: string) => contexts[name] ?? null,
    }) as unknown as HTMLCanvasElement;

  it("accepts WebGL 2", () => {
    expect(supportsWebGL(canvasWith({ webgl2: {} }))).toBe(true);
  });

  it("accepts WebGL 1 as a fallback", () => {
    expect(supportsWebGL(canvasWith({ webgl: {} }))).toBe(true);
  });

  it("rejects browsers without WebGL", () => {
    expect(supportsWebGL(canvasWith({}))).toBe(false);
  });

  it("rejects when creating the context throws", () => {
    const throwing = () =>
      ({
        getContext: () => {
          throw new Error("blocked");
        },
      }) as unknown as HTMLCanvasElement;
    expect(supportsWebGL(throwing)).toBe(false);
  });
});
