/** A friend's site the lab links to. */
export interface Friend {
  /** Lowercase id, typed in the terminal as `open <id>`. */
  id: string;
  /** The friend's name, also accepted by `open`. */
  name: string;
  /** Name of the site, used as the link text. */
  site: string;
  url: string;
  /** One line about the site. */
  about: string;
}

/** The friends of the lab. */
export const friends: readonly Friend[] = [
  {
    id: "domifolio",
    name: "Domi",
    site: "DomiFolio",
    url: "https://diewilhelms.de/",
    about: "the portfolio of my friend Domi",
  },
];

/** Looks up a friend by id or name, ignoring case. */
export function findFriend(idOrName: string): Friend | undefined {
  const wanted = idOrName.toLowerCase();
  return friends.find(
    (friend) => friend.id === wanted || friend.name.toLowerCase() === wanted,
  );
}
