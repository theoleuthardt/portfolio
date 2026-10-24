import { lazy, Suspense } from "react";
import { isPhoneViewport } from "../scene/device";
import { RackFallback } from "./RackFallback";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { useViewport } from "./useViewport";

const Scene = lazy(() => import("../scene/Scene"));

/** Props of {@link SceneLayer}. */
export interface SceneLayerProps {
  /** Result of the WebGL check, made once at startup. */
  webgl: boolean;
  /** Called when the scene is ready or has failed and the fallback shows. */
  onReady?: () => void;
}

/**
 * The layer behind the terminal: nothing on phones, a static rack without
 * WebGL, otherwise the lazily loaded 3D scene. If the scene fails, the
 * static rack takes its place.
 */
export function SceneLayer({ webgl, onReady }: SceneLayerProps) {
  const viewport = useViewport();
  if (isPhoneViewport(viewport)) {
    return null;
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-end pr-[8vw]">
      {webgl ? (
        <SceneErrorBoundary fallback={<RackFallback />} onError={onReady}>
          <Suspense fallback={null}>
            <Scene onReady={onReady} />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <RackFallback />
      )}
    </div>
  );
}
