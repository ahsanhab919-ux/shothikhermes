import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const UpgradePrompt = ({ onClose }) => {
  return (
    <div className="flex h-full max-h-[calc(100dvh-200px)] min-h-[calc(100dvh-200px)] flex-col items-center justify-center p-3 text-center">
      <div className="mb-1 text-base font-semibold">
        Unlock Premium Features
      </div>
      <div className="text-muted-foreground mb-3 text-sm">
        Upgrade to a premium plan to access advanced plagiarism checking,
        history, tone analysis, and comparison tools.
      </div>
      <Link href="/pricing" onClick={onClose}>
        <Button size="sm" data-rybbit-event="clicked_upgrade_plan">
          <SvgColor
            src="/navbar/diamond.svg"
            className="mr-2 h-4 w-4 md:h-5 md:w-5"
          />
          Upgrade Plan
        </Button>
      </Link>
    </div>
  );
};

export default UpgradePrompt;
