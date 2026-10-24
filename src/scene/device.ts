/** Viewport facts that decide whether the 3D scene is loaded. */
export interface Viewport {
  width: number;
  height: number;
  coarsePointer: boolean;
}

/**
 * Mobile devices get the terminal only, without any 3D scene: viewports
 * narrower than 640 px, and touch devices narrower than 1024 px or lower
 * than 500 px (phones in landscape, tablets in portrait).
 */
export function isPhoneViewport({
  width,
  height,
  coarsePointer,
}: Viewport): boolean {
  return width < 640 || (coarsePointer && (width < 1024 || height < 500));
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
