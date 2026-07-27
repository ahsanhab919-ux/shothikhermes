import { cn } from "@/lib/utils";
import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const SuccessCheckIcon: React.FC<IconProps> = ({ className, ...props }) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary h-6 w-6", className)}
      {...props}
    >
      <g clipPath="url(#clip0_5122_13354)">
        <path
          d="M20.9156 3.97031L11.2922 17.7234L5.4 13.6078L6.76875 11.6391L10.7062 14.4L19.1297 2.34844C17.1375 0.876562 14.6625 0 12 0C5.37656 0 0 5.37656 0 12C0 18.6234 5.37656 24 12 24C18.6234 24 24 18.6234 24 12C24 8.91562 22.8328 6.09375 20.9156 3.97031Z"
          fill="#00A85B"
        />
        <path
          d="M6.76914 11.6393L5.40039 13.608L11.2926 17.7236L20.916 3.97051C20.377 3.37051 19.777 2.83145 19.1254 2.34863L10.702 14.4002L6.76914 11.6393Z"
          fill="#F9FAFB"
        />
      </g>
      <defs>
        <clipPath id="clip0_5122_13354">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default SuccessCheckIcon;
