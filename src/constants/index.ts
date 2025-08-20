import { godot, network, snakexp, toolbox } from "../assets";

export const navLinks = [
  {
    id: "home",
    title: "Home",
    type: "page_link",
  },
  {
    id: "projects",
    title: "Projects",
    type: "scroll_link",
  },
  {
    id: "github",
    title: "Github",
    href: "https://github.com/theoleuthardt",
    type: "external_link",
  },
  {
    id: "alexinabox",
    title: "AlexInABox",
    href: "https://alexinabox.de",
    type: "external_link",
  },
];

export const projects = [
  {
    id: "werkzeugkiste",
    title: "Werkzeugkiste",
    link: "https://toolbox.theocloud.dev",
    icon: toolbox,
  },
  {
    id: "network-interaction",
    title: "Network Interaction",
    link: "https://github.com/theoleuthardt/network-interaction",
    icon: network,
  },
  {
    id: "snake-xp",
    title: "SnakeXP",
    link: "https://github.com/theoleuthardt/SnakeXP",
    icon: snakexp,
  },
  {
    id: "grow-green",
    title: "Grow Green",
    link: "https://github.com/AlexInABox/grow-green/releases",
    icon: godot,
  },
];
