import { useEffect, useRef, useState } from "react";
import { findProject } from "./content/projects";
import type { MonitorPose, ScreenPlacement } from "./scene/monitor/CrtMonitor";
import { homography } from "./scene/monitor/seat";
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

/** Longest time the screen waits for the 3D terminal to be seated. */
export const SEAT_TIMEOUT_MS = 2500;

/**
 * Variant C: the scene fills the screen and an opened project appears as a
 * panel on the right (≥ 1024 px). There, once the scene is ready, the
 * visitor sits at a 3D terminal on a desk beside the rack and the HTML
 * terminal is mapped onto its screen; the screen only shows once the scene
 * reports them seated (or after {@link SEAT_TIMEOUT_MS}). Below 1024 px, while
 * maximized or without the scene, the terminal keeps its 2D housing and
 * shows project screens itself; phones and touch tablets get the terminal
 * only. The boot waits for the scene, at most {@link SCENE_TIMEOUT_MS}. Where
 * the scene is shown, the terminal can be maximized, minimized into a bar or
 * closed behind a button, which stands the visitor up to look around; at
 * the desk, maximizing leans in to the screen for a close look. It
 * stays mounted, so its session survives, and opening a project from the
 * rack brings it back.
 */
const App = () => {
  const [webgl] = useState(() => supportsWebGL());
  const [openProjectId, setOpenProjectId] = useState<string>();
  const [sceneSettled, setSceneSettled] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [terminalWindow, setTerminalWindow] = useState<TerminalWindow>("open");
  const [maximized, setMaximized] = useState(false);
  const [seated, setSeated] = useState(false);
  const [seatForced, setSeatForced] = useState(false);
  const terminal = useRef<TerminalHandle>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const windowElement = useRef<HTMLDivElement>(null);
  const connector = useRef<SVGPolylineElement>(null);
  const viewport = useViewport();
  const wide = viewport.width >= WIDE_SCREEN;
  const sceneShown = webgl && !isPhoneViewport(viewport);
  const sceneLoading = sceneShown && !sceneSettled;
  const windowState = sceneShown ? terminalWindow : "open";
  const deskAvailable = sceneShown && wide && sceneReady && !sceneFailed;
  const monitorPose: MonitorPose = !deskAvailable
    ? "off"
    : windowState !== "open"
      ? "standing"
      : maximized
        ? "close"
        : "seated";
  const atScreen = monitorPose === "seated" || monitorPose === "close";
  const waitingForSeat = atScreen && !seated && !seatForced;
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
    if (!waitingForSeat) {
      return;
    }
    const timer = window.setTimeout(() => setSeatForced(true), SEAT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [waitingForSeat]);

  useEffect(() => {
    if (windowState !== "open") {
      restoreButton.current?.focus();
    } else if (!waitingForSeat) {
      terminal.current?.focus();
    }
  }, [windowState, waitingForSeat]);

  /**
   * Maps the terminal window onto the 3D terminal's screen, drawn at about
   * its size on the page so the text stays sharp, or back into the page
   * layout when there is no 3D screen.
   */
  const placeScreen = (placement: ScreenPlacement | undefined) => {
    const element = windowElement.current;
    if (element === null) {
      return;
    }
    if (placement === undefined) {
      if (element.hasAttribute("style")) {
        element.removeAttribute("style");
      }
      return;
    }
    const width = Math.round(placement.width);
    const height = Math.round(placement.height);
    Object.assign(element.style, {
      position: "fixed",
      left: "0",
      top: "0",
      margin: "0",
      aspectRatio: "auto",
      width: `${width}px`,
      height: `${height}px`,
      transformOrigin: "0 0",
      transform: `matrix3d(${homography(width, height, placement.quad).join(",")})`,
    });
  };

  const openProject =
    wide && openProjectId !== undefined
      ? findProject(openProjectId)
      : undefined;

  return (
    <main
      data-look-surface
      className="relative flex h-dvh flex-col justify-end overflow-hidden bg-void p-2 sm:p-6 lg:justify-start"
    >
      <SceneLayer
        webgl={webgl}
        onReady={() => {
          setSceneSettled(true);
          setSceneReady(true);
        }}
        onFail={() => setSceneFailed(true)}
        openProjectId={openProjectId}
        onSelectProject={(id) => {
          setTerminalWindow("open");
          terminal.current?.run(`open ${id}`);
        }}
        connector={connector}
        promptAnchor={() =>
          windowState === "open" ? terminal.current?.promptAnchor() : undefined
        }
        onScreenPlacement={placeScreen}
        monitorPose={monitorPose}
        onSeatedChange={(value) => {
          setSeated(value);
          if (!value) {
            setSeatForced(false);
          }
        }}
      />
      {wide ? (
        <svg className="hud-connector" aria-hidden="true">
          <polyline ref={connector} />
        </svg>
      ) : null}
      <div
        ref={windowElement}
        data-terminal-window
        hidden={windowState !== "open"}
        inert={waitingForSeat}
        aria-hidden={waitingForSeat || undefined}
        className={
          maximized && sceneShown && monitorPose === "off"
            ? "relative z-10 h-full"
            : "relative z-10 h-full sm:mb-[22dvh] sm:ml-[4vw] sm:aspect-[4/3] sm:h-auto sm:w-[min(calc(100%_-_15rem),calc(42dvh*4/3))] lg:mb-0 lg:ml-0 lg:mt-[3vh] lg:w-[min(36rem,40vw,calc((100dvh_-_16rem)*4/3))]"
        }
      >
        <Terminal
          ref={terminal}
          onOpenProjectChange={setOpenProjectId}
          inlineProjectScreens={!wide}
          holdBoot={sceneLoading}
          rackHint={sceneShown}
          housing={!atScreen}
          powered={!waitingForSeat}
          controls={
            sceneShown
              ? {
                  onMinimize: () => setTerminalWindow("minimized"),
                  onClose: () => setTerminalWindow("closed"),
                  onToggleMaximize: () => setMaximized((current) => !current),
                  maximized,
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
