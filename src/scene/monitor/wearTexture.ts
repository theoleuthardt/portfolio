import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import grimeUrl from "../../assets/crt-grime.svg";
import rustUrl from "../../assets/crt-rust.svg";

const SIZE = 512;

/**
 * Worn plastic for the 3D monitor: white with the stains, flakes and rust of
 * the 2D monitor's wear textures, multiplied with the material colour. The
 * texture starts plain white and is redrawn once the SVGs have loaded.
 */
export function wearTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  if (context === null) {
    return texture;
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, SIZE, SIZE);
  const grime = new Image();
  const rust = new Image();
  let loaded = 0;
  const draw = () => {
    loaded += 1;
    if (loaded < 2) {
      return;
    }
    for (const x of [0, SIZE / 2]) {
      for (const y of [0, SIZE / 2]) {
        context.drawImage(grime, x, y, SIZE / 2, SIZE / 2);
      }
    }
    context.drawImage(rust, 0, 0, SIZE, SIZE);
    texture.needsUpdate = true;
  };
  grime.onload = draw;
  rust.onload = draw;
  grime.src = grimeUrl;
  rust.src = rustUrl;
  return texture;
}
