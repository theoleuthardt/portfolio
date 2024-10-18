import { BrowserRouter } from "react-router-dom";
import { AnimatedBackground } from "animated-backgrounds";
import { Hero, Navbar, Projects } from "./components";
import { useRef } from "react";

const App = () => {
  const projectsRef = useRef<HTMLDivElement>(null);

  return (
    <BrowserRouter>
      <div className="relative z-0 bg-transparent">
        <AnimatedBackground animationName="auroraBorealis" />
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar projectsRef={projectsRef} />
          <div
            className="flex justify-center items-center justify-items-center 
                       mt-[20rem]"
          >
            <Hero />
          </div>
          <div
            className="flex justify-center items-center mt-[62rem] 
            lg:mb-[15rem] md:mb-[15rem] sm:mb-[15rem] mb-[8rem]"
          >
            <Projects projectsRef={projectsRef} />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
