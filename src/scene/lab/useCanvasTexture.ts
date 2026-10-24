import { useEffect, useState } from "react";
import type { CanvasTexture } from "three";

/** A canvas texture made once by `create` and disposed with the component. */
export function useCanvasTexture(create: () => CanvasTexture): CanvasTexture {
  const [texture] = useState(create);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
