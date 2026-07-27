import { cn } from "@/lib/utils";

const useTitleSx = (isLast) => {
  return cn("inline-block z-[1]", isLast && "animate-shine");
};

export default useTitleSx;
