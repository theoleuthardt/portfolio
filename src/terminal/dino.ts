/** Width of the dino game in columns. */
export const DINO_WIDTH = 40;

const ROWS = 5;
const DINO_X = 4;
const JUMP_SPEED = 15;
const GRAVITY = 37.5;
const HIT_HEIGHT = 0.8;
const HIGH_SCORE = 1337;
const MAX_STEP_MS = 50;

/** The state of a dino run. */
export interface DinoGame {
  ms: number;
  score: number;
  /** Height of the dino above the ground, in rows. */
  height: number;
  /** Upward speed in rows per second. */
  velocity: number;
  /** Columns of the cacti, moving left. */
  cacti: readonly number[];
  spawned: number;
  over: boolean;
}

function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

/** A fresh run with the first cactus just right of the screen. */
export function newDinoGame(): DinoGame {
  return {
    ms: 0,
    score: 0,
    height: 0,
    velocity: 0,
    cacti: [DINO_WIDTH + 2],
    spawned: 1,
    over: false,
  };
}

/**
 * The run `dt` milliseconds later: the dino jumps if asked and on the
 * ground, falls back under gravity, the cacti move left faster and faster
 * with new ones at random gaps, and the run ends when a cactus meets the
 * dino near the ground. Long steps run as 50 ms sub-steps, so no cactus
 * slips through. A finished run does not change any more.
 */
export function dinoStep(game: DinoGame, dt: number, jump: boolean): DinoGame {
  if (game.over) {
    return game;
  }
  if (dt > MAX_STEP_MS) {
    return dinoStep(dinoStep(game, MAX_STEP_MS, jump), dt - MAX_STEP_MS, false);
  }
  const seconds = dt / 1000;
  const start = game.height === 0 && jump ? JUMP_SPEED : game.velocity;
  const rose = game.height + start * seconds - 0.5 * GRAVITY * seconds ** 2;
  const height = Math.max(0, rose);
  const velocity = height === 0 ? 0 : start - GRAVITY * seconds;
  const ms = game.ms + dt;
  const speed = Math.min(24, 12 + ms / 2500);
  const cacti = game.cacti
    .map((x) => x - speed * seconds)
    .filter((x) => x > -1);
  let spawned = game.spawned;
  const last = cacti[cacti.length - 1] ?? 0;
  if (last < DINO_WIDTH - (18 + noise(spawned) * 12)) {
    cacti.push(DINO_WIDTH + 1);
    spawned += 1;
  }
  const over = cacti.some(
    (x) => x >= DINO_X - 0.5 && x < DINO_X + 1 && height < HIT_HEIGHT,
  );
  return {
    ms,
    score: game.score + seconds * 10,
    height,
    velocity,
    cacti,
    spawned,
    over,
  };
}

/** The text screen of a run: score, sky, dino, cacti, ground and a hint. */
export function dinoFrame(game: DinoGame): string[] {
  const rows = Array.from({ length: ROWS }, () =>
    Array.from({ length: DINO_WIDTH }, () => " "),
  );
  for (const x of game.cacti) {
    const column = Math.round(x);
    if (column >= 0 && column < DINO_WIDTH) {
      rows[ROWS - 1][column] = "#";
    }
  }
  const dinoRow = ROWS - 1 - Math.min(ROWS - 1, Math.round(game.height));
  rows[dinoRow][DINO_X] = "D";
  const score = String(Math.floor(game.score)).padStart(5, "0");
  return [
    `score ${score}  hi ${HIGH_SCORE}`,
    "",
    ...rows.map((row) => row.join("")),
    "_".repeat(DINO_WIDTH),
    game.over
      ? "GAME OVER - space to restart, q to quit"
      : "space jumps, q quits",
  ];
}
