import type { CanvasTexture } from "three";
import { canvasTexture, FONT } from "../props/propTextures";

/** The front of the vending machine: a neon logo above rows of cans. */
export function vendingTexture(): CanvasTexture {
  return canvasTexture(
    256,
    512,
    (context) => {
      context.fillStyle = "#07040a";
      context.fillRect(0, 0, 256, 512);
      context.textAlign = "center";
      context.font = `40px ${FONT}`;
      context.shadowColor = "#33ff66";
      context.shadowBlur = 18;
      context.fillStyle = "#d4ffdc";
      context.fillText("SYNTH", 128, 58);
      context.font = `26px ${FONT}`;
      context.fillStyle = "#33ff66";
      context.fillText("· COLA ·", 128, 92);
      context.shadowBlur = 0;
      const colours = ["#33ff66", "#4dff88", "#ffb000", "#33ff66", "#9aa39d"];
      for (let row = 0; row < 6; row++) {
        context.fillStyle = "#14101a";
        context.fillRect(16, 124 + row * 58, 224, 50);
        for (let column = 0; column < 6; column++) {
          context.fillStyle = colours[(row * 2 + column) % colours.length];
          context.fillRect(26 + column * 36, 130 + row * 58, 22, 36);
          context.fillStyle = "rgba(255,255,255,0.35)";
          context.fillRect(28 + column * 36, 132 + row * 58, 4, 30);
        }
      }
      context.fillStyle = "rgba(255,255,255,0.06)";
      context.fillRect(10, 116, 120, 360);
      context.fillStyle = "#8f8a7c";
      context.font = `14px ${FONT}`;
      context.fillText("2 CR · NO REFUNDS · NO SLEEP", 128, 496);
    },
    true,
  );
}

/** The arcade screen: pixel invaders and a blinking-ready "INSERT COIN". */
export function arcadeTexture(): CanvasTexture {
  return canvasTexture(
    256,
    208,
    (context) => {
      context.fillStyle = "#020403";
      context.fillRect(0, 0, 256, 208);
      context.fillStyle = "#33ff66";
      const invader = [
        "00100000100",
        "00010001000",
        "00111111100",
        "01101110110",
        "11111111111",
        "10111111101",
        "10100000101",
        "00011011000",
      ];
      for (let column = 0; column < 5; column++) {
        for (let row = 0; row < 2; row++) {
          invader.forEach((line, y) =>
            [...line].forEach((cell, x) => {
              if (cell === "1") {
                context.fillRect(
                  22 + column * 44 + x * 3,
                  30 + row * 34 + y * 3,
                  3,
                  3,
                );
              }
            }),
          );
        }
      }
      context.fillStyle = "#33ff66";
      context.fillRect(120, 168, 18, 8);
      context.textAlign = "center";
      context.font = `16px ${FONT}`;
      context.fillStyle = "#ffb000";
      context.fillText("HI 31337", 128, 18);
      context.fillStyle = "#dcffe4";
      context.fillText("INSERT COIN", 128, 150);
    },
    true,
  );
}

/** The whiteboard: a hand-drawn network diagram and a sticky note. */
export function whiteboardTexture(): CanvasTexture {
  return canvasTexture(
    512,
    320,
    (context) => {
      context.fillStyle = "#e9ece8";
      context.fillRect(0, 0, 512, 320);
      context.lineWidth = 3;
      context.font = `20px ${FONT}`;
      const box = (x: number, y: number, label: string, ink: string) => {
        context.strokeStyle = ink;
        context.fillStyle = ink;
        context.strokeRect(x, y, 110, 46);
        context.fillText(label, x + 12, y + 30);
      };
      box(30, 40, "edge", "#1f4fbf");
      box(200, 40, "rack-01", "#0b7a3b");
      box(370, 40, "rack-02", "#b3261e");
      box(200, 180, "backups", "#0b7a3b");
      context.strokeStyle = "#222";
      context.beginPath();
      context.moveTo(140, 63);
      context.lineTo(200, 63);
      context.moveTo(310, 63);
      context.lineTo(370, 63);
      context.moveTo(255, 86);
      context.lineTo(255, 180);
      context.stroke();
      context.fillStyle = "#b3261e";
      context.fillText("TODO: finish me", 340, 120);
      context.fillStyle = "#222";
      context.fillText("uptime > sleep", 30, 280);
      context.fillStyle = "#ffe66d";
      context.fillRect(380, 190, 110, 100);
      context.fillStyle = "#3a3320";
      context.font = `17px ${FONT}`;
      context.fillText("it's always", 392, 230);
      context.fillText("DNS.", 392, 256);
    },
    true,
  );
}

/** An oscilloscope screen: a grid with a green sine and a yellow square wave. */
export function scopeTexture(): CanvasTexture {
  return canvasTexture(256, 192, (context) => {
    context.fillStyle = "#020806";
    context.fillRect(0, 0, 256, 192);
    context.strokeStyle = "#0f3a22";
    context.lineWidth = 1;
    for (let x = 0; x <= 256; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, 192);
      context.stroke();
    }
    for (let y = 0; y <= 192; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y);
      context.stroke();
    }
    context.lineWidth = 3;
    context.strokeStyle = "#33ff66";
    context.beginPath();
    for (let x = 0; x <= 256; x += 4) {
      const y = 64 + 36 * Math.sin(x / 18);
      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
    context.strokeStyle = "#ffb000";
    context.beginPath();
    for (let x = 0; x <= 256; x += 32) {
      const high = (x / 32) % 2 === 0;
      context.lineTo(x, high ? 132 : 168);
      context.lineTo(x + 32, high ? 132 : 168);
    }
    context.stroke();
  });
}

/** A small status display with one line of text, like on a UPS or cooler. */
export function statusTexture(text: string, ink = "#33ff66"): CanvasTexture {
  return canvasTexture(
    256,
    64,
    (context) => {
      context.fillStyle = "#020806";
      context.fillRect(0, 0, 256, 64);
      context.font = `22px ${FONT}`;
      context.fillStyle = ink;
      context.shadowColor = ink;
      context.shadowBlur = 8;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(text, 128, 34, 240);
    },
    true,
  );
}
