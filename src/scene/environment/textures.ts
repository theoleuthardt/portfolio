import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

function canvasTexture(
  size: number,
  draw: (context: CanvasRenderingContext2D, size: number) => void,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context !== null) {
    draw(context, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/** Glowing pattern under the glass floor panels: a grid with circuit traces. */
export function glassFloorTexture(): CanvasTexture {
  const texture = canvasTexture(256, (context, size) => {
    context.fillStyle = "#0b3a2e";
    context.fillRect(0, 0, size, size);
    context.strokeStyle = "#2ef2c0";
    context.lineWidth = 3;
    context.strokeRect(10, 10, size - 20, size - 20);
    context.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      const y = (size / 6) * i;
      context.beginPath();
      context.moveTo(24, y);
      context.lineTo(size * 0.45, y);
      context.lineTo(size * 0.55, y + (i % 2 === 0 ? 14 : -14));
      context.lineTo(size - 24, y + (i % 2 === 0 ? 14 : -14));
      context.stroke();
      context.fillStyle = "#c8ffe9";
      context.fillRect(size - 30, y - 4 + (i % 2 === 0 ? 14 : -14), 8, 8);
    }
  });
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
