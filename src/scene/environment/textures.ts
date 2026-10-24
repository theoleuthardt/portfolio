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

/**
 * Roughness map of 4 × 4 floor tiles: polished tiles with slightly varying
 * roughness and rough grout lines, so reflections break up like on real tiles.
 */
export function tileRoughnessTexture(): CanvasTexture {
  return canvasTexture(512, (context, size) => {
    const tile = size / 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const shade = 40 + ((row * 7 + col * 13) % 5) * 12;
        context.fillStyle = `rgb(${shade},${shade},${shade})`;
        context.fillRect(col * tile, row * tile, tile, tile);
      }
    }
    context.strokeStyle = "rgb(230,230,230)";
    context.lineWidth = 6;
    for (let i = 0; i <= 4; i++) {
      context.beginPath();
      context.moveTo(i * tile, 0);
      context.lineTo(i * tile, size);
      context.moveTo(0, i * tile);
      context.lineTo(size, i * tile);
      context.stroke();
    }
  });
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
