import { useState, MutableRefObject } from "react";
import { Link } from "react-router-dom";

import { styles } from "../styles.ts";
import { navLinks } from "../constants";
import { logo_me, menu, close } from "../assets";

export interface ref {
  projectsRef: MutableRefObject<HTMLDivElement | null>;
}

export const Navbar = ({ projectsRef }: ref) => {
  const [active, setActive] = useState<string>("");
  const [toggle, setToggle] = useState<boolean>(false);

  return (
    <nav
      className={`${styles.paddingX} w-full flex items-center py-5 fixed top-0 z-20 bg-transparent`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => {
            setActive("");
            window.scrollTo(0, 0);
          }}
        >
          <img src={logo_me} alt="Logo" className="w-9 h-9 object-contain" />
          <p
            className="text-white rainbowText text-[18px] font-bold 
          cursor-pointer sm:block hidden"
          >
            Theo.
          </p>
        </Link>
        <ul className="list-none hidden sm:flex flex-row gap-10">
          {navLinks.map((link) => (
            <li
              key={link.id}
              className={`${
                active === link.title ? "text-white" : "text-secondary"
              } rainbowText text-[18px] font-medium cursor-pointer`}
              onClick={() => {
                setActive(link.title);
                if (link.title === "Projects" && projectsRef) {
                  projectsRef.current?.scrollIntoView({ behavior: "smooth" });
                } else if (link.title === "Home") {
                  scrollTo(0, 0);
                }
              }}
            >
              {link.title === "Github" ? (
                <a
                  href="https://github.com/theoleuthardt"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.title}
                </a>
              ) : (
                <a href={`#${link.id}`}>{link.title}</a>
              )}
            </li>
          ))}
        </ul>

        <div
          className="sm:hidden flex flex-1 justify-end items-center"
          onClick={() => setActive(active === "" ? "active" : "")}
        >
          <img
            src={toggle ? close : menu}
            alt="menu"
            className="w-[28px] h-[28px] object-contain cursor-pointer"
            onClick={() => setToggle(!toggle)}
          />
          <div
            className={`${!toggle ? "hidden" : "flex"} p-6 black-gradient absolute top-20 right-0 mx-4 my-2 
            min-w-[140px] z-10 rounded-xl`}
          >
            <ul className="list-none flex justify-end items-start flex-col gap-4">
              {navLinks.map((link) => (
                <li
                  key={link.id}
                  className={`${
                    active === link.title ? "text-white" : "text-secondary"
                  } font-poppins font-medium text-[16px] hover:text-white cursor-pointer`}
                  onClick={() => {
                    setActive(link.title);
                    setToggle(!toggle);
                  }}
                >
                  <a href={`#${link.id}`}>{link.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};
