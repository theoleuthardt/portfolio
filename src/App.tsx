import { useEffect, useRef, useState } from "react";
import { findProject } from "./content/projects";
import { isPhoneViewport, supportsWebGL } from "./scene/device";
import { ProjectPanel } from "./ui/ProjectPanel";
import { SceneLayer } from "./ui/SceneLayer";
import { Terminal, type TerminalHandle } from "./ui/Terminal";
import { useViewport } from "./ui/useViewport";

const WIDE_SCREEN = 1024;

/** Whether the terminal window is shown, folded into a bar, or closed. */
type TerminalWindow = "open" | "minimized" | "closed";

/** Longest time the boot waits for the 3D scene before it finishes anyway. */
export const SCENE_TIMEOUT_MS = 8000;

/**
 * Variant C: the scene fills the screen, the CRT terminal is docked left and
 * an opened project appears as a panel on the right (≥ 1024 px). Below that
 * the terminal sits in the lower part and shows project screens itself;
 * phones and touch tablets get the terminal only. The boot waits for the
 * scene, at most {@link SCENE_TIMEOUT_MS}. Where the scene is shown, the
 * terminal can be minimized into a bar or closed behind a button to free the
 * view of the lab; it stays mounted, so its session survives, and opening a
 * project from the rack brings it back.
 */
const App = () => {
  const [webgl] = useState(() => supportsWebGL());
  const [openProjectId, setOpenProjectId] = useState<string>();
  const [sceneSettled, setSceneSettled] = useState(false);
  const [terminalWindow, setTerminalWindow] = useState<TerminalWindow>("open");
  const terminal = useRef<TerminalHandle>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const connector = useRef<SVGPolylineElement>(null);
  const viewport = useViewport();
  const wide = viewport.width >= WIDE_SCREEN;
  const sceneShown = webgl && !isPhoneViewport(viewport);
  const sceneLoading = sceneShown && !sceneSettled;
  const windowState = sceneShown ? terminalWindow : "open";
  useEffect(() => {
    if (!sceneLoading) {
      return;
    }
    const timer = window.setTimeout(
      () => setSceneSettled(true),
      SCENE_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [sceneLoading]);

  useEffect(() => {
    if (windowState === "open") {
      terminal.current?.focus();
    } else {
      restoreButton.current?.focus();
    }
  }, [windowState]);

  const openProject =
    wide && openProjectId !== undefined
      ? findProject(openProjectId)
      : undefined;

  return (
    <main className="relative flex h-dvh flex-col justify-end overflow-hidden bg-void p-2 sm:p-6 lg:justify-start">
      <SceneLayer
        webgl={webgl}
        onReady={() => setSceneSettled(true)}
        openProjectId={openProjectId}
        onSelectProject={(id) => {
          setTerminalWindow("open");
          terminal.current?.run(`open ${id}`);
        }}
        connector={connector}
        promptAnchor={() => terminal.current?.promptAnchor()}
        focusLayout={wide ? "docked" : "sheet"}
      />
      {wide ? (
        <svg className="hud-connector" aria-hidden="true">
          <polyline ref={connector} />
        </svg>
      ) : null}
      <div
        hidden={windowState !== "open"}
        className="relative z-10 h-full sm:h-[55%] lg:h-full lg:w-[min(46rem,55vw)]"
      >
        <Terminal
          ref={terminal}
          onOpenProjectChange={setOpenProjectId}
          inlineProjectScreens={!wide}
          holdBoot={sceneLoading}
          rackHint={sceneShown}
          controls={
            sceneShown
              ? {
                  onMinimize: () => setTerminalWindow("minimized"),
                  onClose: () => setTerminalWindow("closed"),
                }
              : undefined
          }
        />
      </div>
      {windowState === "minimized" ? (
        <button
          ref={restoreButton}
          type="button"
          className="crt-dock"
          aria-label="restore terminal"
          onClick={() => setTerminalWindow("open")}
        >
          <span className="crt-led" aria-hidden="true" />
          guest@theocloud — tty1
          <span aria-hidden="true">▴</span>
        </button>
      ) : null}
      {windowState === "closed" ? (
        <button
          ref={restoreButton}
          type="button"
          className="crt-launcher"
          aria-label="open terminal"
          onClick={() => setTerminalWindow("open")}
        >
          <span aria-hidden="true">&gt;_</span>
        </button>
      ) : null}
      {openProject ? <ProjectPanel project={openProject} /> : null}
    </main>
  );
};

export default App;
