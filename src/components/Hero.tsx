import Typewriter from "typewriter-effect";

export const Hero = () => {
  return (
    <div 
      className="w-96 flex justify-items-center text-white text-[75px] font-bold cursor-pointer sm:block"
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
