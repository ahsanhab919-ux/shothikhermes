import { cn } from "@/lib/utils";

const ArrowSwitchIcon = ({ className, ...props }) => {
  return (
    <svg
      className={cn("h-6 w-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Top arrow (left) */}
      <path d="M7 8L3 12L7 16" />
      <line x1="3" y1="12" x2="21" y2="12" />

      {/* Bottom arrow (right) */}
      <path d="M17 16L21 12L17 8" />
      <line x1="21" y1="12" x2="3" y2="12" />
    </svg>
  );
};

export default ArrowSwitchIcon;
