import { about, contacts } from "./about";
import { friends } from "./friends";
import { projects as allProjects, type Project } from "./projects";

const escape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The page without JavaScript: who Theo is, a short note, and the
 * projects, friends' sites and contacts as plain links, built from the typed content at build time.
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
  const story = about.paragraphs
    .map((paragraph) => `<p>${escape(paragraph)}</p>`)
    .join("");
  const reach = contacts
    .map(
      (contact) =>
        `<a href="${escape(contact.url)}">${escape(contact.label)}</a>`,
    )
    .join(", ");
  return `<h1>${escape(about.name)}</h1><p>${escape(about.role)}. This portfolio is a terminal and needs JavaScript.</p>${story}<p>The projects:</p><ul>${items}</ul><p>Friends: ${sites}</p><p>Contact: ${reach}</p>`;
}
