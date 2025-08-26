import { godot, network, toolbox, dinosaur, docker, python } from "../assets";

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
  {
    id: "lagopodus",
    title: "Lagopodus",
    href: "https://lagopodus.github.io/portfolio/",
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
    id: "homelab-docker-compose",
    title: "Homelab Docker",
    link: "https://github.com/theoleuthardt/homelab-docker-compose",
    icon: docker,
  },
  {
    id: "python-best-practices",
    title: "Python Best Practices",
    link: "https://github.com/theoleuthardt/python-best-practices",
    icon: python,
  },
  {
    id: "dino-game",
    title: "Dino Game",
    link: "https://github.com/theoleuthardt/DinoGame",
    icon: dinosaur,
  },
  {
    id: "grow-green",
    title: "Grow Green",
    link: "https://github.com/AlexInABox/grow-green/releases",
    icon: godot,
  },
];
