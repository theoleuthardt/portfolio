import { useState } from "react";
import { findProject } from "./content/projects";
import { isPhoneViewport, supportsWebGL } from "./scene/device";
import { ProjectPanel } from "./ui/ProjectPanel";
import { SceneLayer } from "./ui/SceneLayer";
import { Terminal } from "./ui/Terminal";
import { useViewport } from "./ui/useViewport";

const WIDE_SCREEN = 1024;

/**
 * Variant C: the scene fills the screen, the CRT terminal is docked left and
 * an opened project appears as a panel on the right (≥ 1024 px). Below that
 * the terminal sits in the lower part and shows project screens itself;
 * phones get the terminal only.
 */
const App = () => {
  const [webgl] = useState(() => supportsWebGL());
  const [openProjectId, setOpenProjectId] = useState<string>();
  const [sceneReady, setSceneReady] = useState(false);
  const viewport = useViewport();
  const wide = viewport.width >= WIDE_SCREEN;
  const sceneLoading = webgl && !isPhoneViewport(viewport) && !sceneReady;
  const openProject =
    wide && openProjectId !== undefined
      ? findProject(openProjectId)
      : undefined;

  return (
    <main className="relative flex h-dvh flex-col justify-end overflow-hidden bg-void p-2 sm:p-6 lg:justify-start">
      <SceneLayer webgl={webgl} onReady={() => setSceneReady(true)} />
      <div className="relative z-10 h-full sm:h-[55%] lg:h-full lg:w-[min(46rem,55vw)]">
        <Terminal
          onOpenProjectChange={setOpenProjectId}
          inlineProjectScreens={!wide}
          holdBoot={sceneLoading}
        />
      </div>
      {openProject ? <ProjectPanel project={openProject} /> : null}
    </main>
  );
};

export default App;
