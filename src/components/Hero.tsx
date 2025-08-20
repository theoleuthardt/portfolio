import Typewriter from "typewriter-effect";
import Button from "./Button.tsx";
import React, { useState } from "react";

export const Hero = ({
  projectsRef,
}: {
  projectsRef: React.RefObject<HTMLDivElement>;
}) => {
  const [showButton, setShowButton] = useState(false);

  return (
    <div
      className="lg:w-[48rem] md:w-[40rem] sm:w-[30rem] w-[20rem]
      h-auto lg:text-8xl md:text-7xl sm:text-6xl text-6xl text-white text-center 
      font-bold tracking-wide flex flex-col"
    >
      <Typewriter
        onInit={(typewriter) => {
          typewriter
            .typeString("Hii! I'm Theo.")
            .pauseFor(900)
            .deleteAll()
            .typeString("Welcome to my Portfolio!")
            .start()
            .callFunction(() => {
              setShowButton(true);
            });
        }}
      />
      <div
        className={`flex justify-center items-center lg:w-[48rem] md:w-[40rem] sm:w-[30rem] w-[20rem]
        h-auto lg:text-2xl md:text-xl sm:text-lg text-lg text-white text-center
        rounded-lg mt-14
        transition-opacity duration-1000 ease-in ${
          showButton ? "opacity-100" : "opacity-0"
        }`}
      >
        <Button
          className=""
          label={"Explore my projects!"}
          type={"button"}
          onClick={() => {
            projectsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }}
        />
      </div>
    </div>
  );
};
