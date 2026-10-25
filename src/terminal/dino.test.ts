import { describe, expect, it } from "vitest";
import { DINO_WIDTH, dinoFrame, dinoStep, newDinoGame } from "./dino";

const run = (ms: number, jumpAt: number[] = []) => {
  let game = newDinoGame();
  for (let t = 0; t < ms; t += 50) {
    game = dinoStep(game, 50, jumpAt.includes(t));
  }
  return game;
};

describe("dinoStep", () => {
  it("scores the distance run", () => {
    expect(run(2000).score).toBeGreaterThan(run(1000).score);
  });

  it("jumps up and lands again", () => {
    let game = dinoStep(newDinoGame(), 50, true);
    expect(game.height).toBeGreaterThan(0);
    for (let step = 0; step < 40; step++) {
      game = dinoStep(game, 50, false);
    }
    expect(game.height).toBe(0);
  });

  it("does not jump again in the air", () => {
    const up = dinoStep(dinoStep(newDinoGame(), 50, true), 50, false);
    const again = dinoStep(up, 50, true);
    expect(again.velocity).toBeLessThan(up.velocity);
  });

  it("ends when a cactus hits the dino on the ground", () => {
    let game = newDinoGame();
    for (let step = 0; step < 400 && !game.over; step++) {
      game = dinoStep(game, 50, false);
    }
    expect(game.over).toBe(true);
    const frozen = dinoStep(game, 50, true);
    expect(frozen).toEqual(game);
  });

  it("only collides where the frame draws the dino on the ground", () => {
    const airborne = {
      ...newDinoGame(),
      height: 0.6,
      velocity: 2,
      cacti: [4.5],
    };
    const next = dinoStep(airborne, 1, false);
    expect(next.over).toBe(false);
    const rows = dinoFrame(next);
    expect(rows[rows.length - 3]).not.toContain("D");
  });

  it("catches collisions in long steps, too", () => {
    expect(dinoStep(newDinoGame(), 3100, false).over).toBe(true);
  });

  it("survives a cactus by jumping over it", () => {
    let game = newDinoGame();
    let jumped = false;
    for (let step = 0; step < 400; step++) {
      const ahead = game.cacti.some((x) => x > 4 && x < 7.5);
      game = dinoStep(game, 50, ahead && game.height === 0);
      jumped ||= ahead;
    }
    expect(jumped).toBe(true);
    expect(game.over).toBe(false);
  });
});

describe("dinoFrame", () => {
  it("draws the ground, the dino, the cacti and the score", () => {
    const frame = dinoFrame(newDinoGame());
    expect(frame[0]).toMatch(/^score 0+ {2}hi 1337$/);
    expect(frame[frame.length - 2]).toHaveLength(DINO_WIDTH);
    expect(frame.join("\n")).toContain("D");
    expect(frame[frame.length - 2]).toMatch(/^_+$/);
  });

  it("says game over when it is over", () => {
    let game = newDinoGame();
    for (let step = 0; step < 400 && !game.over; step++) {
      game = dinoStep(game, 50, false);
    }
    expect(dinoFrame(game).join("\n")).toMatch(/GAME OVER/);
  });
});
