import { modes } from "@/_mock/tools/paraphrase";
import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Lock, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ModeModal = ({
  showModeModal,
  handleClose,
  selectedMode,
  userPackage,
  setSelectedMode,
  isLoading,
}) => {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <>
      <Dialog open={showModeModal} onOpenChange={handleClose}>
        <DialogContent
          className={cn(
            "fixed top-auto right-0 bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-lg rounded-b-none p-6 pb-4",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          )}
          showCloseButton={false}
        >
          <div className="relative">
            <h2 className="text-xl font-semibold">Choose a mode</h2>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-0 right-0 z-10"
            >
              <X className="size-4" />
            </Button>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {modes.map((mode, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md border p-2",
                    "cursor-pointer transition-colors",
                    selectedMode === mode.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground",
                    isLoading && "pointer-events-none opacity-50",
                  )}
                  onClick={() => {
                    if (isLoading) return; // Disable click if loading
                    if (mode.package.includes(userPackage || "free")) {
                      setSelectedMode(mode.value);
                      handleClose();
                    } else {
                      setShowAlert(true);
                    }
                  }}
                >
                  {!mode.package.includes(userPackage || "free") && (
                    <Lock className="size-3" />
                  )}
                  <span className="text-sm font-semibold">{mode.value}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlert} onOpenChange={() => setShowAlert(false)}>
        <DialogContent
          className={cn(
            "fixed top-auto right-0 bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-lg rounded-b-none p-0",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "bg-background/90 backdrop-blur-md",
          )}
          showCloseButton={false}
        >
          <div className="flex min-h-[200px] items-center justify-center py-10">
            <Link href="/pricing?redirect=paraphrase">
              <Button
                variant="default"
                size="default"
                className="flex items-center gap-2"
                data-rybbit-event="clicked_upgrade_plan"
              >
                <SvgColor
                  src="/navbar/diamond.svg"
                  className="h-5 w-5 md:h-6 md:w-6"
                />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ModeModal;
