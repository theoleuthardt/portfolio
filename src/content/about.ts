/** Who Theo is, for `about`, the about server and the desktop's About. */
export interface About {
  name: string;
  role: string;
  paragraphs: readonly string[];
}

/** A public way to reach Theo. */
export interface Contact {
  /** Lowercase id. */
  id: string;
  /** Name of the channel, used as the link text. */
  label: string;
  url: string;
}

/** About Theo, in his own words (issue #76). */
export const about: About = {
  name: "Theo Leuthardt",
  role: "Software Developer",
  paragraphs: [
    "Born to write Python, used to write Java. At first I was hooked on frontend development, until my dual studies taught me to write backend code; since then I love writing backends.",
    "I think code shouldn't be a dogma or a matter of faith. Coding should bring people together to create cool things and solve problems, not make more of them.",
  ],
};

/** The contact channels Theo wants public, without tracking parameters. */
export const contacts: readonly Contact[] = [
  { id: "github", label: "GitHub", url: "https://github.com/theoleuthardt" },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/theo-leuthardt-228373376",
  },
];
