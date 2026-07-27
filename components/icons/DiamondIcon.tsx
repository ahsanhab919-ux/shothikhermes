import { cn } from "@/lib/utils";
import React from "react";

const DiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  ...rest
}) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary size-4", className)}
      {...rest}
    >
      <path
        d="M6.825 5.25L9.475 0H9.775L12.425 5.25H6.825ZM8.875 17.1L0.25 6.75H8.875V17.1ZM10.375 17.1V6.75H19L10.375 17.1ZM14.075 5.25L11.475 0H16.625L19.25 5.25H14.075ZM0 5.25L2.625 0H7.775L5.175 5.25H0Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default DiamondIcon;
