import type { Project } from "../content/projects";

/** Props of {@link ProjectScreen}. */
export interface ProjectScreenProps {
  project: Project;
}

/** The detail screen of a project, shown after `open <project>`. */
export function ProjectScreen({ project }: ProjectScreenProps) {
  return (
    <section
      aria-labelledby={`project-${project.id}`}
      className="crt-screen my-3"
    >
      <p className="text-hud uppercase text-phosphor-dim">
        module {project.id} // rack-01 · running
      </p>
      <h2
        id={`project-${project.id}`}
        className="text-screen-title text-phosphor"
      >
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
        <a href={project.repository} target="_blank" rel="noopener noreferrer">
          &gt; repository ↗
        </a>
        {project.fork ? (
          <a
            href={project.fork.upstream}
            target="_blank"
            rel="noopener noreferrer"
          >
            &gt; upstream ↗
          </a>
        ) : null}
      </p>
    </section>
  );
}
