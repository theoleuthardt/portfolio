import { useEffect, useState } from "react";
import type { Viewport } from "../scene/device";

function read(): Viewport {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    coarsePointer:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
  };
}

/** Current viewport size and pointer type; follows resizes. */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return viewport;
}
