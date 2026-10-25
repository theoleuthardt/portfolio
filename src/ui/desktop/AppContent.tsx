import { lazy, Suspense, useState } from "react";
import { friends } from "../../content/friends";
import { findProject, projects } from "../../content/projects";
import { NOTES, TRASH } from "../../desktop/apps";
import type { AppId } from "../../desktop/windows";
import { absolute, buildFileSystem, readFile } from "../../terminal/fs";
import type { TopState } from "../../terminal/processes";
import { ProjectScreen } from "../ProjectScreen";
import { Top } from "../Top";
import { PixelIcon } from "./PixelIcon";

const WorldMap = lazy(() => import("../WorldMap"));
const FILE_SYSTEM = buildFileSystem();

/** Props of {@link AppContent}. */
export interface AppContentProps {
  app: AppId;
  payload?: string;
  /** Runs a terminal command, e.g. `open <project>`, so the scene follows. */
  onRun: (command: string) => void;
  /** Opens another app, e.g. a viewer for a file. */
  onOpen: (app: AppId, payload?: string) => void;
  /** Closes this window. */
  onClose: () => void;
  /** Projects show their screen in the window; else the page shows it. */
  inlineProjectScreens: boolean;
  processes: Omit<TopState, "now">;
}

function Projects({
  onRun,
  inlineProjectScreens,
}: Pick<AppContentProps, "onRun" | "inlineProjectScreens">) {
  const [selected, setSelected] = useState<string>();
  const project = selected === undefined ? undefined : findProject(selected);
  return (
    <div className="desk-app">
      <ul className="desk-files" aria-label="projects">
        {projects.map(({ id }) => (
          <li key={id}>
            <button
              type="button"
              className="desk-file"
              aria-pressed={selected === id}
              onClick={() => {
                setSelected(id);
                onRun(`open ${id}`);
              }}
            >
              <PixelIcon name="folder" />
              {id}
            </button>
          </li>
        ))}
      </ul>
      {project && inlineProjectScreens ? (
        <ProjectScreen project={project} />
      ) : null}
    </div>
  );
}

function FileList({
  label,
  files,
  onOpenFile,
}: {
  label: string;
  files: readonly string[];
  onOpenFile: (file: string) => void;
}) {
  return (
    <ul className="desk-files" aria-label={label}>
      {files.map((file) => (
        <li key={file}>
          <button
            type="button"
            className="desk-file"
            onClick={() => onOpenFile(file)}
          >
            <PixelIcon name="note" />
            {file.replace(/^~\/(notes\/)?/, "")}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Trash({ onOpen }: Pick<AppContentProps, "onOpen">) {
  const [emptied, setEmptied] = useState(false);
  return (
    <div className="desk-app">
      <FileList
        label="trash"
        files={Object.keys(TRASH)}
        onOpenFile={(file) => onOpen("viewer", `trash:${file}`)}
      />
      <button
        type="button"
        className="crt-chip"
        onClick={() => setEmptied(true)}
      >
        empty trash
      </button>
      {emptied ? (
        <p role="status">the lab keeps everything. nice try.</p>
      ) : null}
    </div>
  );
}

function Viewer({ payload = "" }: { payload?: string }) {
  const lines = payload.startsWith("trash:")
    ? TRASH[payload.slice("trash:".length)]
    : readFile(FILE_SYSTEM, absolute(payload, "~"));
  return (
    <pre className="desk-viewer">
      {(lines ?? [`${payload}: No such file or directory`]).join("\n")}
    </pre>
  );
}

function About() {
  return (
    <div className="desk-app">
      <p className="text-screen-title text-phosphor">Theo Leuthardt</p>
      <p>
        The person behind this lab and the {projects.length} projects in its
        rack.
      </p>
      <p>
        <a
          href="https://github.com/theoleuthardt"
          target="_blank"
          rel="noopener noreferrer"
        >
          &gt; github.com/theoleuthardt ↗
        </a>
      </p>
      <p>
        Friends:{" "}
        {friends.map((friend) => (
          <a
            key={friend.id}
            href={friend.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {friend.site} ↗
          </a>
        ))}
      </p>
    </div>
  );
}

/** What a desktop window shows, by app. */
export function AppContent({
  app,
  payload,
  onRun,
  onOpen,
  onClose,
  inlineProjectScreens,
  processes,
}: AppContentProps) {
  switch (app) {
    case "projects":
      return (
        <Projects onRun={onRun} inlineProjectScreens={inlineProjectScreens} />
      );
    case "about":
      return <About />;
    case "map":
      return (
        <Suspense fallback={<p>loading the map ...</p>}>
          <WorldMap onQuit={onClose} />
        </Suspense>
      );
    case "processes":
      return <Top state={processes} onQuit={onClose} />;
    case "notes":
      return (
        <FileList
          label="notes"
          files={NOTES}
          onOpenFile={(file) => onOpen("viewer", file)}
        />
      );
    case "viewer":
      return <Viewer payload={payload} />;
    case "trash":
      return <Trash onOpen={onOpen} />;
  }
}
