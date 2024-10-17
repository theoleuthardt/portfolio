import { BrowserRouter } from "react-router-dom";
import { AnimatedBackground } from "animated-backgrounds";
import {
  Hero,
  Navbar
} from "./components";

const App = () => {
  return (
    <BrowserRouter>
      <div className="relative z-0 bg-transparent">
        <AnimatedBackground animationName="auroraBorealis"/>
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
          <Navbar />
          <div className="flex justify-center items-center min-h-screen">
            <Hero />
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
