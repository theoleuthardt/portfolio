import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/** The font of every text drawn into a texture. */
export const FONT = '"Share Tech Mono", ui-monospace, monospace';

/**
 * A canvas texture drawn by `draw`. Text-bearing textures pass
 * `redrawWithFont`, so they are drawn again once the web font has loaded and
 * never keep the fallback font.
 */
export function canvasTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
  redrawWithFont = false,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const paint = () => {
    if (context !== null) {
      context.clearRect(0, 0, width, height);
      draw(context);
    }
  };
  paint();
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  if (redrawWithFont) {
    void document.fonts?.load(`16px ${FONT}`).then(
      () => {
        paint();
        texture.needsUpdate = true;
      },
      () => undefined,
    );
  }
  return texture;
}

/** The lab's neon sign: a big glowing word and a small caption below it. */
export function neonSignTexture(title: string, caption: string): CanvasTexture {
  const texture = canvasTexture(
    1024,
    256,
    (context) => {
      context.clearRect(0, 0, 1024, 256);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `128px ${FONT}`;
      context.shadowColor = "#4dff88";
      context.shadowBlur = 24;
      context.strokeStyle = "#4dff88";
      context.lineWidth = 5;
      context.strokeText(title, 512, 100);
      context.fillStyle = "#dcffe4";
      context.fillText(title, 512, 100);
      context.font = `40px ${FONT}`;
      context.shadowColor = "#33ff66";
      context.fillStyle = "#33ff66";
      context.fillText(caption, 512, 205);
    },
    true,
  );
  return texture;
}

/** A green terminal screen for the CRT monitors on the workbench. */
export function crtScreenTexture(seed: number): CanvasTexture {
  return canvasTexture(256, 192, (context) => {
    context.fillStyle = "#031008";
    context.fillRect(0, 0, 256, 192);
    context.fillStyle = "#33ff66";
    context.font = `14px ${FONT}`;
    for (let line = 0; line < 9; line++) {
      const width = 40 + ((seed * 37 + line * 53) % 170);
      context.fillRect(14, 18 + line * 18, width, 6);
    }
    context.fillStyle = "rgba(0,0,0,0.35)";
    for (let y = 0; y < 192; y += 3) {
      context.fillRect(0, y, 256, 1);
    }
  });
}

/** Amber and black hazard stripes, tiling along the strip. */
export function hazardStripesTexture(): CanvasTexture {
  const texture = canvasTexture(128, 32, (context) => {
    context.fillStyle = "#0a0a08";
    context.fillRect(0, 0, 128, 32);
    context.fillStyle = "#ffb000";
    for (let x = -32; x < 160; x += 32) {
      context.beginPath();
      context.moveTo(x, 32);
      context.lineTo(x + 16, 32);
      context.lineTo(x + 32, 0);
      context.lineTo(x + 16, 0);
      context.fill();
    }
  });
  texture.wrapS = RepeatWrapping;
  return texture;
}

/** A wall monitor with HUD graphics: a load chart, bars and a status line. */
export function hudScreenTexture(title: string, seed: number): CanvasTexture {
  return canvasTexture(
    512,
    288,
    (context) => {
      context.fillStyle = "#020a06";
      context.fillRect(0, 0, 512, 288);
      context.strokeStyle = "#1d5a2c";
      context.lineWidth = 2;
      context.strokeRect(6, 6, 500, 276);
      context.font = `22px ${FONT}`;
      context.fillStyle = "#33ff66";
      context.fillText(title, 20, 36);
      context.strokeStyle = "#4dff88";
      context.lineWidth = 3;
      context.beginPath();
      for (let i = 0; i <= 30; i++) {
        const x = 20 + i * 10;
        const y = 150 - 50 * Math.abs(Math.sin(seed + i * 0.45)) - (i % 4) * 6;
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
      for (let i = 0; i < 8; i++) {
        const height = 20 + ((seed * 31 + i * 47) % 90);
        context.fillStyle = i % 3 === 0 ? "#ffb000" : "#33ff66";
        context.fillRect(350 + i * 18, 170 - height, 12, height);
      }
      context.fillStyle = "#1d9a3f";
      context.font = `16px ${FONT}`;
      context.fillText("STATUS: NOMINAL   TEMP 41C   UPLINK OK", 20, 250);
    },
    true,
  );
}

/** A rectangular wall sign with text on a coloured plate. */
export function signTexture(
  text: string,
  plate: string,
  ink: string,
): CanvasTexture {
  const texture = canvasTexture(
    512,
    96,
    (context) => {
      context.fillStyle = plate;
      context.fillRect(0, 0, 512, 96);
      context.strokeStyle = ink;
      context.lineWidth = 4;
      context.strokeRect(8, 8, 496, 80);
      context.fillStyle = ink;
      context.font = `40px ${FONT}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, 256, 50, 470);
    },
    true,
  );
  return texture;
}

/** The dark glossy brand panel beside a terminal's screen. */
export function brandPanelTexture(): CanvasTexture {
  return canvasTexture(
    256,
    512,
    (context) => {
      const gradient = context.createLinearGradient(0, 0, 256, 512);
      gradient.addColorStop(0, "#2a2a28");
      gradient.addColorStop(1, "#0d0d0c");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 512);
      context.textAlign = "center";
      context.font = `34px ${FONT}`;
      context.shadowColor = "#33ff66";
      context.shadowBlur = 14;
      context.fillStyle = "#b9ffcc";
      context.fillText("TheoCloud", 128, 400);
      context.font = `18px ${FONT}`;
      context.shadowColor = "#33ff66";
      context.fillStyle = "#33ff66";
      context.fillText("data systems", 128, 430);
      context.shadowBlur = 0;
      context.fillStyle = "#8f8a7c";
      context.fillText("PWR", 92, 486);
    },
    true,
  );
}

/** A postcard propped up on the desk, linking a friend's site. */
export function postcardTexture(title: string, address: string): CanvasTexture {
  return canvasTexture(
    384,
    256,
    (context) => {
      context.fillStyle = "#0c1a10";
      context.fillRect(0, 0, 384, 256);
      context.strokeStyle = "#33ff66";
      context.lineWidth = 4;
      context.strokeRect(10, 10, 364, 236);
      context.textAlign = "center";
      context.font = `44px ${FONT}`;
      context.shadowColor = "#33ff66";
      context.shadowBlur = 12;
      context.fillStyle = "#b9ffcc";
      context.fillText(`${title} ↗`, 192, 112);
      context.shadowBlur = 0;
      context.font = `22px ${FONT}`;
      context.fillStyle = "#4dff88";
      context.fillText(address, 192, 168);
      context.font = `16px ${FONT}`;
      context.fillStyle = "#8f8a7c";
      context.fillText("click to visit", 192, 214);
    },
    true,
  );
}
