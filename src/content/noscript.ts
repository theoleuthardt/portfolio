import { friends } from "./friends";
import { projects as allProjects, type Project } from "./projects";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The page without JavaScript: a short note and the projects and friends'
 * sites as plain links, built from the typed content at build time.
 */
export function noscriptHtml(
  projects: readonly Project[] = allProjects,
): string {
  const items = projects
    .map(
      (project) =>
        `<li><a href="${escape(project.repository)}">${escape(project.title)}</a>: ${escape(project.tagline)}</li>`,
    )
    .join("");
  const sites = friends
    .map(
      (friend) => `<a href="${escape(friend.url)}">${escape(friend.site)}</a>`,
    )
    .join(", ");
  return `<h1>Theo Leuthardt</h1><p>This portfolio is a terminal and needs JavaScript. The projects:</p><ul>${items}</ul><p>Friends: ${sites}</p><p><a href="https://github.com/theoleuthardt">github.com/theoleuthardt</a></p>`;
}
