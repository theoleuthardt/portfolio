import Typewriter from "typewriter-effect";

export const Hero = () => {
  return (
    <div
      className="lg:w-[48rem] md:w-[40rem] sm:w-[30rem] w-[20rem]
      h-auto lg:text-8xl md:text-7xl sm:text-6xl text-6xl text-white text-center font-bold cursor-pointer"
    >
      <Typewriter
        onInit={(typewriter) => {
          typewriter
            .typeString("Welcome!")
            .pauseFor(1000)
            .deleteAll()
            .typeString("I'm Theo.")
            .pauseFor(500)
            .deleteAll()
            .typeString("I'm a cs student.")
            .pauseFor(500)
            .deleteAll()
            .typeString("Feel free to look around!")
            .start();
        }}
      />
    </div>
  );
};
