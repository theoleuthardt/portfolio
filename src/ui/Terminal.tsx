import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { findProject, projects } from "../content/projects";
import { commandNames } from "../terminal/commands";
import { complete } from "../terminal/complete";
import { stepBack, stepForward } from "../terminal/history";
import { createSession, submit, type LogEntry } from "../terminal/session";
import { bootSteps } from "../terminal/boot";
import { BootScreen } from "./BootScreen";
import { CrtFrame } from "./CrtFrame";
import { ProjectScreen } from "./ProjectScreen";
import { TerminalOutput } from "./TerminalOutput";
import { useBootSequence } from "./useBootSequence";

const PROMPT = "guest@theocloud:~$";
const projectIds = projects.map((project) => project.id);

function Prompt({ command }: { command: string }) {
  return (
    <p>
      <span className="text-phosphor-dim">{PROMPT}</span>{" "}
      <span className="text-phosphor">{command}</span>
    </p>
  );
}

/**
 * The CRT terminal: boot sequence, command log, project screens and the
 * input with history (arrow keys) and completion (Tab). Only the screen of
 * the currently open project is expanded. Tab completes only when there is
 * something to complete, so Tab and Shift+Tab otherwise move focus as usual.
 */
export function Terminal() {
  const [session, setSession] = useState(createSession);
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const bootReached = useBootSequence(bootSteps.length);
  const booted = bootReached >= bootSteps.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo?.({ top: logRef.current.scrollHeight });
  }, [session.log, bootReached]);

  const runCommand = (command: string) => {
    setSession((current) => submit(current, command).session);
    setInput("");
    setOptions([]);
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Enter") {
      runCommand(input);
    } else if (event.key === "Tab" && !event.shiftKey && input.trim() !== "") {
      const completion = complete(input, commandNames, projectIds);
      if (completion.input === input && completion.options.length === 0) {
        return;
      }
      event.preventDefault();
      setInput(completion.input);
      setOptions(completion.options.length > 1 ? completion.options : []);
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setOptions([]);
      const step =
        event.key === "ArrowUp"
          ? stepBack(session.history, input)
          : stepForward(session.history, input);
      setSession((current) => ({ ...current, history: step.history }));
      setInput(step.value);
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
    entry.command === undefined && !booted ? [] : entry.lines;

  return (
    <CrtFrame>
      <div
        ref={logRef}
        className="crt-text h-full overflow-y-auto"
        onClick={() => {
          if (window.getSelection()?.isCollapsed !== false) {
            inputRef.current?.focus();
          }
        }}
      >
        <div role="log" aria-live="polite" aria-label="terminal output">
          {session.log.map((entry) => {
            const project =
              entry.id === expandedEntryId && entry.projectId !== undefined
                ? findProject(entry.projectId)
                : undefined;
            return (
              <div key={entry.id} className="mb-2">
                {entry.command === undefined ? (
                  <BootScreen reached={bootReached} />
                ) : (
                  <Prompt command={entry.command} />
                )}
                {linesOf(entry).map((line, index) => (
                  <TerminalOutput key={index} line={line} onRun={runCommand} />
                ))}
                {project ? <ProjectScreen project={project} /> : null}
              </div>
            );
          })}
        </div>
        <label className="flex items-center gap-2">
          <span className="text-phosphor-dim">{PROMPT}</span>
          <input
            ref={inputRef}
            aria-label="terminal input"
            className="crt-input flex-1"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setOptions([]);
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
        {options.length > 0 ? (
          <p className="text-phosphor-dim">{options.join(" ")}</p>
        ) : null}
      </div>
    </CrtFrame>
  );
}
