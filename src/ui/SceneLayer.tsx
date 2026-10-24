import { lazy, Suspense } from "react";
import { isPhoneViewport } from "../scene/device";
import { RackFallback } from "./RackFallback";
import { useViewport } from "./useViewport";

const Scene = lazy(() => import("../scene/Scene"));

/** Props of {@link SceneLayer}. */
export interface SceneLayerProps {
  /** Result of the WebGL check, made once at startup. */
  webgl: boolean;
}

/**
 * The layer behind the terminal: nothing on phones, a static rack without
 * WebGL, otherwise the lazily loaded 3D scene.
 */
export function SceneLayer({ webgl }: SceneLayerProps) {
  const viewport = useViewport();
  if (isPhoneViewport(viewport)) {
    return null;
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-end pr-[8vw]">
      {webgl ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : (
        <RackFallback />
      )}
    </div>
  );
}
