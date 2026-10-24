import { CanvasTexture, SRGBColorSpace } from "three";

const WIDTH = 512;
const HEIGHT = 64;
const FONT = '40px "Share Tech Mono", ui-monospace, monospace';

function draw(canvas: HTMLCanvasElement, text: string): void {
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  context.fillStyle = "#020a05";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.strokeStyle = "#1d5a2c";
  context.lineWidth = 2;
  context.strokeRect(1, 1, WIDTH - 2, HEIGHT - 2);
  context.font = FONT;
  context.textBaseline = "middle";
  context.fillStyle = "#33ff66";
  context.shadowColor = "#33ff66";
  context.shadowBlur = 8;
  context.fillText(text.toUpperCase(), 18, HEIGHT / 2 + 2);
}

/**
 * A label strip texture with `text` in the site font. It is drawn at once
 * and again when the web font has loaded, so the label never stays in the
 * fallback font.
 */
export function labelTexture(text: string): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  draw(canvas, text);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  void document.fonts?.load(FONT).then(
    () => {
      draw(canvas, text);
      texture.needsUpdate = true;
    },
    () => undefined,
  );
  return texture;
}
