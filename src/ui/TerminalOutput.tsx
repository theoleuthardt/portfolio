import type { TerminalLine } from "../terminal/commands";

/** Props of {@link TerminalOutput}. */
export interface TerminalOutputProps {
  line: TerminalLine;
  onRun: (command: string) => void;
}

/** Renders one line of command output; chips and project rows run commands. */
export function TerminalOutput({ line, onRun }: TerminalOutputProps) {
  switch (line.kind) {
    case "text":
      return <p className="text-phosphor">{line.text}</p>;
    case "muted":
      return <p className="text-phosphor-dim">{line.text}</p>;
    case "error":
      return <p className="text-alert">{line.text}</p>;
    case "chips":
      return (
        <p className="my-2 flex flex-wrap gap-2">
          {line.commands.map((command) => (
            <button
              key={command}
              type="button"
              className="crt-chip"
              onClick={() => onRun(command)}
            >
              {command}
            </button>
          ))}
        </p>
      );
    case "command":
      return (
        <p className="my-1 grid items-baseline gap-x-3 sm:grid-cols-[11rem_1fr]">
          <button
            type="button"
            className="crt-chip justify-self-start"
            onClick={() => onRun(line.name)}
          >
            {line.usage}
          </button>
          <span className="pl-3 text-phosphor-dim sm:pl-0">
            {line.description}
          </span>
        </p>
      );
    case "project":
      return (
        <p>
          <button
            type="button"
            className="crt-row"
            onClick={() => onRun(`open ${line.id}`)}
          >
            <span className="text-phosphor">{line.id}</span>{" "}
            <span className="text-phosphor-dim">{line.tagline}</span>
            {line.fork ? <span className="text-amber"> [fork]</span> : null}
          </button>
        </p>
      );
  }
}
