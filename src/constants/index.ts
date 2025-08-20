import { godot, network, snakexp, toolbox } from "../assets";

export const navLinks = [
  {
    id: "home",
    title: "Home",
  },
  {
    id: "projects",
    title: "Projects",
  },
  {
    id: "github",
    title: "Github",
  },
  {
    id: "alexinabox",
    title: "AlexInABox",
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
