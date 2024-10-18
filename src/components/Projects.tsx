import { MutableRefObject } from "react";
import { projects } from "../constants";

export interface ref {
  projectsRef: MutableRefObject<HTMLDivElement | null>;
}

export const Projects = ({
  projectsRef,
}: {
  projectsRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div
      ref={projectsRef}
      className="w-[60rem] h-auto p-6 flex justify-center items-center 
      flex-col gap-6 bg-transparent"
    >
      <h2
        className=" text-white lg:text-8xl md:text-7xl sm:text-6xl text-6xl 
        font-extrabold text-center mb-6 tracking-wide uppercase"
      >
        Projects:
      </h2>
      <div className="flex flex-col sm:flex-row gap-10">
        {projects.map((project) => (
          <div
            key={project.id}
            className="w-[20rem] flex items-center gap-4 bg-white bg-opacity-20 #
            p-4 rounded-xl hover:bg-opacity-30 transition-all"
          >
            <img src={project.icon} alt="backlogIcon" className="w-10 h-10" />
            <div className="text-white text-[18px] font-bold">
              <a href={project.link} className="rainbowText">
                {project.title}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
