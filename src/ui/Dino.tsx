import { useEffect, useRef, useState } from "react";
import { dinoFrame, dinoStep, newDinoGame } from "../terminal/dino";
import { ProgramScreen } from "./ProgramScreen";

const TICK_MS = 50;

/** Props of {@link Dino}. */
export interface DinoProps {
  onQuit: () => void;
}

/** `play dino`: the dino runner in the terminal; space or ↑ jumps. */
export function Dino({ onQuit }: DinoProps) {
  const [game, setGame] = useState(newDinoGame);
  const jump = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const jumping = jump.current;
      jump.current = false;
      setGame((current) => dinoStep(current, TICK_MS, jumping));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <ProgramScreen
      columns={42}
      label="dino game"
      onQuit={onQuit}
      onKey={(event) => {
        if (event.key !== " " && event.key !== "ArrowUp") {
          return false;
        }
        if (game.over) {
          setGame(newDinoGame());
        } else {
          jump.current = true;
        }
        return true;
      }}
    >
      <pre>{dinoFrame(game).join("\n")}</pre>
    </ProgramScreen>
  );
}
