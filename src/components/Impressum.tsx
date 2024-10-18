import React from "react";

export const Impressum = ({
  impressumRef,
}: {
  impressumRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <div
      ref={impressumRef}
      className="text-4xl text-white font-bold flex flex-col"
    >
      <div className="text-5xl">Impressum</div>
      <br />
      <div>Name: Theo Leuthardt</div>
      <div>Adress: S&uuml;dwestkorso 29</div>
      <div>Postal Code: 14197</div>
      <div>City: Berlin</div>
      <br />
      <div className="text-5xl">Contact</div>
      <div>
        Telefone: +49 (0) 176 41870516
        <br />
        E-Mail: theoleuthardt12@gmail.com
      </div>
      <div>
        Source:{" "}
        <a href="https://www.e-recht24.de/impressum-generator.html">
          https://www.e-recht24.de/impressum-generator.html
        </a>
      </div>
    </div>
  );
};
