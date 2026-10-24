import { AnimatedBackground } from "animated-backgrounds";
import { Hero, Navbar, Projects } from "./components";
import { useRef } from "react";

const App = () => {
  const projectsRef = useRef<HTMLDivElement>(null);
  const careerpathRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative z-0 bg-transparent">
      <AnimatedBackground animationName="auroraBorealis" />
      <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
        <Navbar projectsRef={projectsRef} careerpathRef={careerpathRef} />
        <div
          className="flex justify-center items-center justify-items-center 
                       mt-72"
        >
          <Hero projectsRef={projectsRef} />
        </div>
        <div
          className="flex justify-center items-center mt-200
            lg:mb-64 md:mb-56 sm:mb-52 mb-48"
        >
          <Projects projectsRef={projectsRef} />
        </div>
      </div>
    </div>
  );
};

export default App;
