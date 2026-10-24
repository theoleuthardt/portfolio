import { useId } from "react";
import type { Project } from "../content/projects";

/** Props of {@link ProjectScreen}. */
export interface ProjectScreenProps {
  project: Project;
}

/**
 * The detail screen of a project, shown after `open <project>`. Links to
 * the website, releases and packages appear only when the project has them.
 */
export function ProjectScreen({ project }: ProjectScreenProps) {
  const headingId = useId();
  const links = [
    ["repository", project.repository],
    ["website", project.website],
    ["releases", project.releases],
    ["packages", project.packages],
    ["upstream", project.fork?.upstream],
  ] as const;
  return (
    <section aria-labelledby={headingId} className="crt-screen my-3">
      <p className="text-hud uppercase text-phosphor-dim">
        module {project.id} // rack-01 · running
      </p>
      <h2 id={headingId} className="text-screen-title text-phosphor">
        {project.title}
        {project.fork ? <span className="text-amber"> [fork]</span> : null}
      </h2>
      <p className="text-phosphor-dim">{project.tagline}</p>
      <p className="my-2 max-w-[70ch] text-text">{project.summary}</p>
      <ul className="my-2 flex flex-wrap gap-2" aria-label="stack">
        {project.stack.map((item) => (
          <li key={item} className="crt-tag">
            {item}
          </li>
        ))}
      </ul>
      <p className="flex flex-wrap gap-4">
        {links.map(([label, url]) =>
          url === undefined ? null : (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer">
              &gt; {label} ↗
            </a>
          ),
        )}
      </p>
    </section>
  );
}
