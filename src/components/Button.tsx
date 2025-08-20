import React, { MouseEventHandler } from "react";

export interface buttonProps {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  type: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  className?: string;
}

export const Button = ({
  label,
  onClick,
  type,
  className = "",
}: buttonProps) => {
  const baseStyles =
    "flex items-center gap-4 bg-white bg-opacity-20 p-4 rounded-xl " +
    "hover:bg-opacity-30 transform transition-transform duration-200 " +
    "hover:scale-105 cursor-pointer";

  const styles = `${baseStyles} ${className}`;

  return (
    <button type={type} className={styles} onClick={onClick}>
      {label}
    </button>
  );
};

export default Button;
