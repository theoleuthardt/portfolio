/** Viewport facts that decide whether the 3D scene is loaded. */
export interface Viewport {
  width: number;
  height: number;
  coarsePointer: boolean;
}

/**
 * Phones get the terminal only: viewports narrower than 640 px, and touch
 * devices whose viewport is lower than 500 px (phones in landscape).
 */
export function isPhoneViewport({
  width,
  height,
  coarsePointer,
}: Viewport): boolean {
  return width < 640 || (coarsePointer && height < 500);
}

/** Whether the browser can create a WebGL 2 or WebGL 1 context. */
export function supportsWebGL(
  createCanvas: () => HTMLCanvasElement = () =>
    document.createElement("canvas"),
): boolean {
  try {
    const canvas = createCanvas();
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
