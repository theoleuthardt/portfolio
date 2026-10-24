import { lazy, Suspense, type RefObject } from "react";
import type { MonitorPose, ScreenPlacement } from "../scene/monitor/CrtMonitor";
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
  /** Called when the scene has failed, in addition to `onReady`. */
  onFail?: () => void;
  /** The project whose module is ejected, if any. */
  openProjectId?: string;
  /** Called when a rack module is clicked. */
  onSelectProject?: (projectId: string) => void;
  /** SVG polyline for the HUD line from the prompt to the focused module. */
  connector?: RefObject<SVGPolylineElement | null>;
  /** Where the HUD line starts: the terminal prompt. */
  promptAnchor?: () => DOMRect | undefined;
  /** Called every frame with where the HTML screen goes, or `undefined`. */
  onScreenPlacement?: (placement: ScreenPlacement | undefined) => void;
  /** Whether the visitor sits at the 3D terminal, stands, or there is none. */
  monitorPose?: MonitorPose;
  /** Called when the 3D terminal is seated around the screen, or no more. */
  onSeatedChange?: (seated: boolean) => void;
}

/**
 * The layer behind the terminal: nothing on phones, a static rack without
 * WebGL, otherwise the lazily loaded 3D scene. If the scene fails, the
 * static rack takes its place.
 */
export function SceneLayer({
  webgl,
  onReady,
  onFail,
  openProjectId,
  onSelectProject,
  connector,
  promptAnchor,
  onScreenPlacement,
  monitorPose,
  onSeatedChange,
}: SceneLayerProps) {
  const viewport = useViewport();
  if (isPhoneViewport(viewport)) {
    return null;
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-end pr-[8vw]">
      {webgl ? (
        <SceneErrorBoundary
          fallback={<RackFallback />}
          onError={() => {
            onFail?.();
            onReady?.();
          }}
        >
          <Suspense fallback={null}>
            <Scene
              onReady={onReady}
              openProjectId={openProjectId}
              onSelectProject={onSelectProject}
              connector={connector}
              promptAnchor={promptAnchor}
              onScreenPlacement={onScreenPlacement}
              monitorPose={monitorPose}
              onSeatedChange={onSeatedChange}
            />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <RackFallback />
      )}
    </div>
  );
}
