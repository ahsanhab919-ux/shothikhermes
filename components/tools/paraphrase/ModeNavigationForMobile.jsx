import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";
import { useState } from "react";
import MobileFreezeModal from "./MobileFreezeModal";
import ModeModal from "./ModeModal";

const ModeNavigationForMobile = ({
  selectedMode,
  setSelectedMode,
  userPackage,
  initialFrozenWords,
  frozenWords,
  isLoading,
}) => {
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showMoModeModal, setShowModeModal] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-row items-center justify-center gap-2 pt-6 pb-4",
      )}
    >
      <Button
        variant="outlined"
        size="default"
        onClick={() => setShowModeModal(true)}
        disabled={isLoading}
        className="mr-4 rounded-md px-6 min-h-[44px]"
      >
        {selectedMode || "Modes"}
      </Button>
      <Button
        variant="outlined"
        onClick={() => setShowFreezeModal(true)}
        disabled={!userPackage || userPackage === "free"}
        className="text-right min-h-[44px]"
      >
        <Snowflake className="mr-2 size-4" />
        Freeze Words
      </Button>

      <ModeModal
        handleClose={() => setShowModeModal(false)}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        showModeModal={showMoModeModal}
        userPackage={userPackage}
        isLoading={isLoading}
      />

      <MobileFreezeModal
        handleClose={() => setShowFreezeModal(false)}
        isFreeze={showFreezeModal}
        initialFrozenWords={initialFrozenWords}
        frozenWords={frozenWords}
        userPackage={userPackage}
      />
    </div>
  );
};

export default ModeNavigationForMobile;
