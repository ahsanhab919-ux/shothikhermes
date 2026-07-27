import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type SvgColorProps = React.HTMLAttributes<HTMLSpanElement> & {
  src: string;
};

const SvgColor = forwardRef<HTMLSpanElement, SvgColorProps>(
  ({ src, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-block h-6 w-6", "bg-current", className)}
      style={{
        mask: `url(${src}) no-repeat center / contain`,
        WebkitMask: `url(${src}) no-repeat center / contain`,
      }}
      {...props}
    />
  ),
);

SvgColor.displayName = "SvgColor";

export default SvgColor;

