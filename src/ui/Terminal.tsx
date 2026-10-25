import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { friends } from "../content/friends";
import { findProject, projects } from "../content/projects";
import { commandNames } from "../terminal/commands";
import { complete } from "../terminal/complete";
import { reverseSearch, stepBack, stepForward } from "../terminal/history";
import {
  deleteWordBefore,
  killToEnd,
  killToStart,
  type Line,
} from "../terminal/lineEditor";
import {
  appendOutput,
  cancel,
  clearScreen,
  createSession,
  submit,
  type LogEntry,
} from "../terminal/session";
import type { Cwd } from "../terminal/commands";
import type { Program } from "../terminal/output";
import { bootSteps } from "../terminal/boot";
import { BootScreen } from "./BootScreen";
import { emptyDesk } from "../desktop/windows";
import { CrtFrame, type CrtMaximize } from "./CrtFrame";
import { Desktop } from "./desktop/Desktop";
import { ProjectScreen } from "./ProjectScreen";
import { TerminalOutput } from "./TerminalOutput";
import { Dino } from "./Dino";
import { Hack } from "./Hack";
import { Matrix } from "./Matrix";
import { Top } from "./Top";
import { useTabTitle } from "./useTabTitle";
import {
  BOOT_GLIDE_MS,
  useBootPhase,
  useBootSequence,
} from "./useBootSequence";

const WorldMap = lazy(() => import("./WorldMap"));
const projectIds = projects.map((project) => project.id);
const friendIds = friends.map((friend) => friend.id);
const promptFor = (cwd: Cwd = "~") => `guest@theocloud:${cwd}$`;

function Prompt({ command, cwd }: { command: string; cwd?: Cwd }) {
  return (
    <p>
      <span className="text-phosphor-dim">{promptFor(cwd)}</span>{" "}
      <span className="text-phosphor">{command}</span>
    </p>
  );
}

/**
 * Whether only Ctrl is held: Ctrl+Shift, Ctrl+Alt and Cmd shortcuts (hard
 * reload, devtools) stay with the browser.
 */
const plainCtrl = (event: KeyboardEvent<HTMLInputElement>) =>
  event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey;

/** The typed line with a block cursor on the character under the caret. */
function EditLine({ line, focused }: { line: Line; focused: boolean }) {
  const before = line.text.slice(0, line.cursor);
  const under = line.text.charAt(line.cursor) || " ";
  const after = line.text.slice(line.cursor + 1);
  return (
    <span className="crt-line" aria-hidden="true">
      {before}
      <span className={focused ? "crt-cursor" : "crt-cursor crt-cursor-idle"}>
        {under}
      </span>
      {after}
    </span>
  );
}

/** What other parts of the page may do with the terminal. */
export interface TerminalHandle {
  /** Runs a command as if it had been typed, e.g. after a click in the scene. */
  run: (command: string) => void;
  /** Screen rectangle of the prompt input, where the HUD line starts. */
  promptAnchor: () => DOMRect | undefined;
  /** Moves the focus into the prompt, e.g. after the window is restored. */
  focus: () => void;
}

/** Props of {@link Terminal}. */
export interface TerminalProps {
  ref?: Ref<TerminalHandle>;
  /** Called whenever the open project changes, with `undefined` on close. */
  onOpenProjectChange?: (projectId: string | undefined) => void;
  /** Show project screens in the log; off when a side panel shows them. */
  inlineProjectScreens?: boolean;
  /** Keep the boot sequence before its last step, e.g. while the scene loads. */
  holdBoot?: boolean;
  /** Tell visitors that the server rack in the scene is clickable. */
  rackHint?: boolean;
  /** The maximize key, where the window can be maximized. */
  maximize?: CrtMaximize;
  /** Stands the visitor up from the desk, offered on the desktop. */
  onStandUp?: () => void;
  /** Draw the 2D monitor housing; off while the 3D monitor surrounds it. */
  housing?: boolean;
  /** Called when a full-screen program starts, and with `undefined` at its end. */
  onProgramChange?: (program: Program | undefined) => void;
  /** Show the screen; off while the 3D terminal is still being seated. */
  powered?: boolean;
}

/**
 * The CRT terminal: boot sequence, command log, project screens and the
 * input with history (arrow keys) and completion (Tab). Only the screen of
 * the currently open project is expanded. Tab completes like in a terminal;
 * a second Tab that would change nothing moves focus on, Shift+Tab moves it
 * back, so keyboard users can always leave the terminal.
 * Escape closes the open project wherever the focus is. The line edits like
 * bash/readline (Ctrl+A/E/U/K/W, Ctrl+C cancels, Ctrl+L clears the screen,
 * Ctrl+R searches the history backwards) and shows a block cursor; `top`
 * and the other programs take over the screen until they quit. Minimizing
 * or closing the terminal shows the TheoCloud OS desktop, whose windows
 * keep their state while the terminal is open again; the real input is invisible on top of it, so
 * typing, IME and touch keyboards keep working.
 */
export function Terminal({
  ref,
  onOpenProjectChange,
  inlineProjectScreens = true,
  holdBoot = false,
  rackHint = false,
  maximize,
  onStandUp,
  housing = true,
  powered = true,
  onProgramChange,
}: TerminalProps) {
  const [session, setSession] = useState(createSession);
  const [input, setInput] = useState("");
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const caretTarget = useRef<number | null>(null);
  const idleTab = useRef<string | null>(null);
  const [caretMoves, setCaretMoves] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [program, setProgram] = useState<Program>();
  const [terminalApp, setTerminalApp] = useState<
    "open" | "minimized" | "closed"
  >("open");
  const [desk, setDesk] = useState(emptyDesk);
  const programEntry = useRef<number | undefined>(undefined);
  const [search, setSearch] = useState<{
    query: string;
    before?: number;
    original: string;
  }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopFocus = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const bootReached = useBootSequence(bootSteps.length, holdBoot);
  const booted = bootReached >= bootSteps.length;
  const phase = useBootPhase(booted);
  useTabTitle({
    phase,
    percent: bootSteps[Math.min(bootReached, bootSteps.length) - 1].percent,
    cwd: session.cwd,
    openProjectId: session.openProjectId,
  });
  const splash = useRef<HTMLDivElement>(null);
  const splashTop = useRef<number | null>(null);

  useLayoutEffect(() => {
    const block = splash.current;
    if (block === null) {
      return;
    }
    if (phase === "splash") {
      splashTop.current = block.getBoundingClientRect().top;
      return;
    }
    if (phase === "glide" && splashTop.current !== null) {
      const delta = splashTop.current - block.getBoundingClientRect().top;
      splashTop.current = null;
      block.animate?.(
        [{ transform: `translateY(${delta}px)` }, { transform: "none" }],
        { duration: BOOT_GLIDE_MS, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    }
  });

  useEffect(() => {
    if (phase !== "splash") {
      return;
    }
    const measure = () => {
      if (splash.current) {
        splashTop.current = splash.current.getBoundingClientRect().top;
      }
    };
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [phase]);

  useEffect(() => {
    if (terminalApp !== "open") {
      desktopFocus.current?.focus();
    } else if (phase === "ready" && program === undefined) {
      inputRef.current?.focus();
    }
  }, [phase, program, terminalApp]);

  const reportProgram = useEffectEvent((running: Program | undefined) =>
    onProgramChange?.(running),
  );
  useEffect(() => reportProgram(program), [program]);

  const exitProgram = (lines: { text: string; muted: boolean }[] = []) => {
    setProgram(undefined);
    if (lines.length > 0) {
      setSession((current) =>
        appendOutput(
          current,
          lines.map(({ text, muted }) => ({
            kind: muted ? "muted" : "text",
            text,
          })),
          programEntry.current,
        ),
      );
    }
  };

  /**
   * Minimizes or closes the terminal for the desktop. A running program
   * ends with a hangup, as when a real terminal goes away.
   */
  const leaveScreen = (state: "minimized" | "closed") => {
    if (program !== undefined) {
      exitProgram([{ text: "Hangup", muted: true }]);
    }
    setTerminalApp(state);
  };

  useEffect(() => {
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight });
  }, [session.log, bootReached, terminalApp]);

  useEffect(() => {
    if (caretTarget.current !== null) {
      inputRef.current?.setSelectionRange(
        caretTarget.current,
        caretTarget.current,
      );
      caretTarget.current = null;
    }
  }, [caretMoves]);

  const setLine = ({ text, cursor: at }: Line) => {
    setInput(text);
    setCursor(at);
    caretTarget.current = at;
    setCaretMoves((moves) => moves + 1);
  };

  const syncCursor = (field: HTMLInputElement) => {
    if (caretTarget.current === null) {
      setCursor(field.selectionStart ?? field.value.length);
    }
  };

  const runCommand = (command: string) => {
    const { session: next, actions } = submit(session, command);
    for (const action of actions) {
      if (action.type === "visit") {
        window.open(action.url, "_blank", "noopener,noreferrer");
      } else if (action.type === "program") {
        programEntry.current = next.log[next.log.length - 1]?.id;
        setProgram(
          action.name === "hack"
            ? { name: "hack", target: action.target }
            : { name: action.name },
        );
      }
    }
    setSearch(undefined);
    setSession(next);
    if (next.openProjectId !== session.openProjectId) {
      onOpenProjectChange?.(next.openProjectId);
    }
    setLine({ text: "", cursor: 0 });
    setOptions([]);
    idleTab.current = null;
    inputRef.current?.focus();
  };

  /** Readline shortcuts; returns whether the key was handled. */
  const readline = (key: string): boolean => {
    const line = {
      text: input,
      cursor: inputRef.current?.selectionStart ?? cursor,
    };
    switch (key) {
      case "c":
        setSession(cancel(session, input));
        setLine({ text: "", cursor: 0 });
        return true;
      case "l":
        setSession(clearScreen(session));
        return true;
      case "u":
        setLine(killToStart(line));
        return true;
      case "k":
        setLine(killToEnd(line));
        return true;
      case "w":
        setLine(deleteWordBefore(line));
        return true;
      case "a":
        setLine({ text: input, cursor: 0 });
        return true;
      case "e":
        setLine({ text: input, cursor: input.length });
        return true;
      default:
        return false;
    }
  };

  useImperativeHandle(ref, () => ({
    run: (command) => {
      setTerminalApp("open");
      runCommand(command);
    },
    promptAnchor: () => inputRef.current?.getBoundingClientRect(),
    focus: () =>
      (terminalApp === "open" ? inputRef : desktopFocus).current?.focus(),
  }));

  const closeOnEscape = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (
      event.key === "Escape" &&
      !event.isComposing &&
      !event.defaultPrevented &&
      session.openProjectId !== undefined
    ) {
      runCommand("close");
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const hit =
    search === undefined
      ? undefined
      : reverseSearch(session.history.entries, search.query, search.before);

  /** Keys while searching the history with Ctrl+R; returns if handled. */
  const searching = (event: KeyboardEvent<HTMLInputElement>): boolean => {
    if (search === undefined) {
      return false;
    }
    const key = event.key.toLowerCase();
    if (plainCtrl(event) && key === "r") {
      event.preventDefault();
      if (hit) {
        setSearch({ ...search, before: hit.index });
      }
      return true;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      runCommand(hit?.entry ?? search.query);
      return true;
    }
    if (event.ctrlKey && (key === "g" || key === "c")) {
      event.preventDefault();
      setSearch(undefined);
      setLine({ text: search.original, cursor: search.original.length });
      return true;
    }
    if (
      [
        "Escape",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      const accepted = hit?.entry ?? search.query;
      setSearch(undefined);
      setLine({ text: accepted, cursor: accepted.length });
      return true;
    }
    return false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || searching(event)) {
      return;
    }
    if (plainCtrl(event) && event.key.toLowerCase() === "r") {
      event.preventDefault();
      setSearch({ query: "", original: input });
      setLine({ text: "", cursor: 0 });
      setOptions([]);
      return;
    }
    if (plainCtrl(event)) {
      if (readline(event.key.toLowerCase())) {
        event.preventDefault();
        setOptions([]);
      }
      return;
    }
    if (event.key === "Enter") {
      runCommand(input);
    } else if (event.key === "Tab" && !event.shiftKey) {
      const completion = complete(
        input,
        commandNames,
        projectIds,
        session.cwd,
        friendIds,
      );
      const changed = completion.input !== input;
      if (!changed && idleTab.current === input) {
        idleTab.current = null;
        return;
      }
      event.preventDefault();
      idleTab.current = changed ? null : input;
      setLine({ text: completion.input, cursor: completion.input.length });
      setOptions(completion.options.length > 1 ? completion.options : []);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setOptions([]);
      const step =
        event.key === "ArrowUp"
          ? stepBack(session.history, input)
          : stepForward(session.history, input);
      setSession((current) => ({ ...current, history: step.history }));
      setLine({ text: step.value, cursor: step.value.length });
    }
  };

  const expandedEntryId = [...session.log]
    .reverse()
    .find(
      (entry) =>
        entry.projectId !== undefined &&
        entry.projectId === session.openProjectId,
    )?.id;

  const linesOf = (entry: LogEntry) =>
    entry.command === undefined && phase !== "ready" ? [] : entry.lines;

  return (
    <CrtFrame
      title={
        terminalApp === "open" ? `guest@theocloud: ${session.cwd}` : undefined
      }
      controls={{
        onMinimize: () => leaveScreen("minimized"),
        onClose: () => leaveScreen("closed"),
        maximize,
      }}
      housing={housing}
      powered={powered}
    >
      {terminalApp !== "open" ? (
        <Desktop
          desk={desk}
          setDesk={setDesk}
          terminalMinimized={terminalApp === "minimized"}
          onOpenTerminal={() => setTerminalApp("open")}
          onRun={runCommand}
          onStandUp={onStandUp}
          focusRef={desktopFocus}
          inlineProjectScreens={inlineProjectScreens}
          processes={{ killed: session.killed, startedAt: session.startedAt }}
        />
      ) : program?.name === "top" ? (
        <Top
          state={{ killed: session.killed, startedAt: session.startedAt }}
          onQuit={() => exitProgram()}
        />
      ) : program?.name === "hack" ? (
        <Hack target={program.target} onExit={exitProgram} />
      ) : program?.name === "matrix" ? (
        <Matrix onQuit={() => exitProgram()} />
      ) : program?.name === "dino" ? (
        <Dino onQuit={() => exitProgram()} />
      ) : program?.name === "map" ? (
        <Suspense fallback={<p className="crt-text">loading the map ...</p>}>
          <WorldMap onQuit={() => exitProgram()} />
        </Suspense>
      ) : (
        <div
          ref={logRef}
          data-boot-phase={phase}
          className={
            phase === "splash"
              ? "crt-text boot-splash @container h-full overflow-y-auto"
              : "crt-text @container h-full overflow-y-auto"
          }
          onClick={() => {
            if (window.getSelection()?.isCollapsed !== false) {
              inputRef.current?.focus();
            }
          }}
        >
          <div role="log" aria-live="polite" aria-label="terminal output">
            {session.log.map((entry) => {
              const project =
                inlineProjectScreens &&
                entry.id === expandedEntryId &&
                entry.projectId !== undefined
                  ? findProject(entry.projectId)
                  : undefined;
              return (
                <div key={entry.id} className="mb-2">
                  {entry.command === undefined ? (
                    <div ref={splash} data-boot-entry>
                      <BootScreen reached={bootReached} />
                    </div>
                  ) : (
                    <Prompt command={entry.command} cwd={entry.cwd} />
                  )}
                  {linesOf(entry).map((line, index) => (
                    <TerminalOutput
                      key={index}
                      line={line}
                      onRun={runCommand}
                    />
                  ))}
                  {rackHint &&
                  entry.command === undefined &&
                  phase === "ready" ? (
                    <p className="text-phosphor-dim">
                      tip: click a module in the server rack to open a project
                    </p>
                  ) : null}
                  {project ? <ProjectScreen project={project} /> : null}
                </div>
              );
            })}
          </div>
          {phase === "ready" ? (
            <label className="crt-prompt">
              <span className="text-phosphor-dim">
                {search
                  ? `(${hit || search.query === "" ? "" : "failed "}reverse-i-search)\`${search.query}':`
                  : promptFor(session.cwd)}
              </span>
              <span className="crt-edit">
                {search ? (
                  <span className="crt-search-hit" aria-hidden="true">
                    {hit?.entry ?? ""}
                  </span>
                ) : (
                  <EditLine line={{ text: input, cursor }} focused={focused} />
                )}
                <input
                  ref={inputRef}
                  aria-label="terminal input"
                  className="crt-input"
                  value={input}
                  onChange={(event) => {
                    idleTab.current = null;
                    if (search) {
                      setSearch({
                        ...search,
                        query: event.target.value,
                        before: undefined,
                      });
                    }
                    setInput(event.target.value);
                    syncCursor(event.target);
                    setOptions([]);
                  }}
                  onSelect={(event) => syncCursor(event.currentTarget)}
                  onKeyUp={(event) => syncCursor(event.currentTarget)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={onKeyDown}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </span>
            </label>
          ) : null}
          {options.length > 0 ? (
            <p className="text-phosphor-dim">{options.join(" ")}</p>
          ) : null}
        </div>
      )}
    </CrtFrame>
  );
}
