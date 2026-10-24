import type { Project } from "../content/projects";
import { ProjectScreen } from "./ProjectScreen";

/** Props of {@link ProjectPanel}. */
export interface ProjectPanelProps {
  project: Project;
}

/** HUD panel on the right that shows the open project on wide screens. */
export function ProjectPanel({ project }: ProjectPanelProps) {
  return (
    <aside aria-label="project" className="hud-panel">
      <ProjectScreen project={project} />
      <p className="text-hud uppercase text-phosphor-dim">
        type close or press esc
      </p>
    </aside>
  );
}
