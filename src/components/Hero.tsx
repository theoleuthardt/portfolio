import Typewriter from "typewriter-effect";

export const Hero = () => {
  return (
    <div
      className="lg:w-[48rem] md:w-[40rem] sm:w-[30rem] w-[20rem]
      h-auto lg:text-8xl md:text-7xl sm:text-6xl text-6xl text-white text-center 
      font-bold tracking-wide"
    >
      <Typewriter
        onInit={(typewriter) => {
          typewriter
            .typeString("Hii! I'm Theo.")
            .pauseFor(900)
            .deleteAll()
            .typeString("Welcome to my Portfolio!")
            .start();
        }}
      />
    </div>
  );
};
