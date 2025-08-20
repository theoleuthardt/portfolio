import { BrowserRouter } from "react-router-dom";
import { AnimatedBackground } from "animated-backgrounds";
import { Hero, Navbar, Projects } from "./components";
import { useRef } from "react";

const App = () => {
  const projectsRef = useRef<HTMLDivElement>(null);
  const careerpathRef = useRef<HTMLDivElement>(null);

  return (
    <BrowserRouter>
      <div className="relative z-0 bg-transparent">
        <AnimatedBackground animationName="auroraBorealis" />
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar projectsRef={projectsRef} careerpathRef={careerpathRef} />
          <div
            className="flex justify-center items-center justify-items-center 
                       mt-[18rem]"
          >
            <Hero projectsRef={projectsRef} />
          </div>
          <div
            className="flex justify-center items-center mt-[50rem]
            lg:mb-[16rem] md:mb-[14rem] sm:mb-[13rem] mb-[12rem]"
          >
            <Projects projectsRef={projectsRef} />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
