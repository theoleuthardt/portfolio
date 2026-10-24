import { useState } from "react";
import { supportsWebGL } from "./scene/device";
import { SceneLayer } from "./ui/SceneLayer";
import { Terminal } from "./ui/Terminal";

const App = () => {
  const [webgl] = useState(() => supportsWebGL());
  return (
    <main className="relative h-dvh overflow-hidden bg-void p-2 sm:p-6">
      <SceneLayer webgl={webgl} />
      <div className="relative z-10 h-full lg:w-[min(46rem,55vw)]">
        <Terminal />
      </div>
    </main>
  );
};

export default App;
