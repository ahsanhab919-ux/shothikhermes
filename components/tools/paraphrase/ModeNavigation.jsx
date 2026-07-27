"use client";
// src/components/tools/paraphrase/ModeNavigation.jsx
import { modes } from "@/_mock/tools/paraphrase";
import { StepRange } from "@/components/common/StepRange";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { useCustomModes } from "@/hooks/useCustomModes";
import { cn } from "@/lib/utils";
import { ChevronDown, Lock, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "react-toastify";
import CustomModeModal from "./CustomModeModal";
import CustomModePopover from "./CustomModePopover";

const ModeNavigation = ({
  selectedMode,
  setSelectedMode,
  userPackage,
  selectedSynonyms,
  setSelectedSynonyms,
  SYNONYMS,
  setShowMessage,
  isLoading,
  accessToken,
  dispatch,
  setShowLoginModal,
}) => {
  // Router for navigation
  const router = useRouter();

  // Responsive flags (approximate original behavior)
  const isXs = useResponsive("down", "sm");
  const isSm = useResponsive("down", "md") && !isXs; // between sm and md
  const isLgBetween = useResponsive("between", "lg-xl");
  const isLgUp = useResponsive("up", "lg");
  const isLg = isLgBetween || isLgUp;

  // Custom modes hook
  const {
    customModes,
    recentModes,
    recommendedModes,
    error: customModeError,
    canCreateCustomModes,
    addCustomMode,
    updateCustomMode,
    deleteCustomMode,
    trackModeUsage,
    clearError,
  } = useCustomModes();

  // Hydration fix: Ensure client matches server initial render (Guest/Free)
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => { setHasMounted(true); }, []);
  const effectivePackage = hasMounted ? (userPackage || "free") : "free";

  // Modal state
  const [customModeModalOpen, setCustomModeModalOpen] = React.useState(false);
  const [isCreatingMode, setIsCreatingMode] = React.useState(false);

  // Popover state for editing custom modes
  const [popoverAnchor, setPopoverAnchor] = React.useState(null);
  const [editingCustomMode, setEditingCustomMode] = React.useState(null);
  const [popoverAnchorRect, setPopoverAnchorRect] = React.useState(null);
  // Track if we're in deletion flow to prevent onClose from interfering
  const isDeletingRef = React.useRef(false);

  // Create steps for StepRange based on SYNONYMS
  // Format exactly like TopNavigation.jsx - value should be the label string
  const synonymSteps = React.useMemo(() => {
    return Object.entries(SYNONYMS)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, value]) => ({
        label: value,
        value: value,
      }));
  }, [SYNONYMS]);

  // Combine default modes with custom modes
  const allModes = React.useMemo(() => {
    return [
      ...modes,
      ...customModes
        .filter((cm) => cm?.name) // Filter out invalid modes
        .map((cm) => ({
          value: cm?.name,
          package: ["value_plan", "pro_plan", "unlimited"],
          isCustom: true,
          id: cm._id || cm.id,
        })),
    ];
  }, [customModes]);

  // Determine how many tabs to show before collapsing
  const visibleCount = isXs ? 1 : isSm ? 3 : 5;

  const initialModes = allModes.slice(0, visibleCount);
  const extraModes = allModes.slice(visibleCount);

  // Handle the "extra" selected mode
  const [extraMode, setExtraMode] = React.useState(() =>
    initialModes.some((m) => m.value === selectedMode) ? null : selectedMode,
  );

  // 

  // Menu state for "More"
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Unified mode-change logic
  const changeMode = (
    value,
    isCustomMode = false,
    customModeId = null,
    event = null,
  ) => {
    if (isLoading) {
      toast.info("Wait until the current process is complete");
      return;
    }

    if (isCustomMode && value === selectedMode) {
      const customMode = customModes.find((cm) => cm._id === customModeId);
      if (customMode) {
        // Set anchor if event is provided
        if (event?.currentTarget) {
          setPopoverAnchor(event.currentTarget);
          try {
            const rect = event.currentTarget.getBoundingClientRect();
            setPopoverAnchorRect(rect);
          } catch (_) {
            // ignore
          }
        } else {
          // Try to find the tab element by querying the DOM
          // This is a fallback if event is not provided
          setTimeout(() => {
            const tabElement =
              document.querySelector(
                `button[role="tab"][data-state="active"][value="${value}"], [data-state="active"][value="${value}"]`,
              ) || document.querySelector(`[value="${value}"]`);
            if (tabElement) {
              setPopoverAnchor(tabElement);
              try {
                const rect = tabElement.getBoundingClientRect();
                setPopoverAnchorRect(rect);
              } catch (_) {
                // ignore
              }
            }
          }, 0);
        }
        setEditingCustomMode(customMode);
      }
      return;
    }

    const modeObj = allModes.find((m) => m.value === value);

    // Add null check
    if (!modeObj) {
      console.error("Mode not found:", value);
      return;
    }

    const isValid = modeObj.package.includes(effectivePackage);

    if (isValid) {
      setSelectedMode(value);
      setShowMessage({ show: false, Component: null });

      if (isCustomMode) {
        trackModeUsage(value);
      }
    } else {
      setShowMessage({ show: true, Component: value });
    }

    if (extraModes.some((m) => m?.value === value)) {
      // Add optional chaining
      setExtraMode(value);
    }
    setMoreOpen(false);
  };

  // Build list of tabs
  const displayedModes = extraMode
    ? [...initialModes, allModes.find((m) => m.value === extraMode)].filter(
      Boolean,
    ) // Remove undefined
    : initialModes;

  // Ensure extraMode stays in sync with selectedMode
  React.useEffect(() => {
    if (
      !initialModes.some((m) => m.value === selectedMode) &&
      extraModes.some((m) => m.value === selectedMode)
    ) {
      setExtraMode(selectedMode);
    } else if (initialModes.some((m) => m.value === selectedMode)) {
      setExtraMode(null);
    }
  }, [selectedMode, initialModes, extraModes]);

  // Guard Tabs value
  const tabHasSelectedMode = displayedModes.some(
    (m) => m?.value === selectedMode,
  );
  const tabsValue = tabHasSelectedMode
    ? selectedMode
    : displayedModes[0]?.value || false;

  // Handle custom mode creation
  const handleCreateCustomMode = async (modeName) => {
    setIsCreatingMode(true);
    try {
      const newMode = await addCustomMode(modeName);
      if (newMode) {
        toast.success(`Custom mode "${modeName}" created successfully!`);
        setCustomModeModalOpen(false);

        // Auto-select the newly created mode
        setSelectedMode(newMode.name);
        setShowMessage({ show: false, Component: null });
      }
    } catch (err) {
      toast.error(customModeError || "Failed to create custom mode");
    } finally {
      setIsCreatingMode(false);
    }
  };

  // Handle custom mode update
  const handleUpdateCustomMode = async (newName) => {
    if (!editingCustomMode) return;

    // CRITICAL FIX: Close popover BEFORE updating
    // This prevents the "jump to top-left" visual glitch
    const modeId = editingCustomMode._id || editingCustomMode.id;
    const oldName = editingCustomMode.name || "Standard";

    // Clear popover state immediately
    setPopoverAnchor(null);
    setEditingCustomMode(null);

    try {
      const success = await updateCustomMode(modeId, newName);
      if (success) {
        toast.success(`Mode updated to "${newName}"`);

        // Sync selectedMode state
        if (selectedMode === oldName) {
          setSelectedMode(newName);
        }

        // Sync extraMode state
        if (extraMode === oldName) {
          setExtraMode(newName);
        }
      }
    } catch (err) {
      toast.error(customModeError || "Failed to update mode");
    }
  };

  // Handle custom mode deletion
  const handleDeleteCustomMode = async () => {
    if (!editingCustomMode) return;

    // CRITICAL FIX: Close popover BEFORE deletion
    // This prevents the "jump to top-left" visual glitch
    const modeId = editingCustomMode._id || editingCustomMode.id;
    const modeName = editingCustomMode.name;

    // Mark that we're in deletion flow
    isDeletingRef.current = true;

    // Clear popover state immediately but keep anchorRect for positioning
    setPopoverAnchor(null);
    setEditingCustomMode(null);
    // Keep popoverAnchorRect temporarily so popover can position during close animation

    try {
      const success = await deleteCustomMode(modeId);
      if (success) {
        toast.success(`Mode "${modeName}" deleted`);

        // CRITICAL: Switch to Standard BEFORE the mode is removed from state
        if (selectedMode === modeName) {
          setSelectedMode("Standard");
        }

        // Clear anchorRect after a short delay to allow close animation
        setTimeout(() => {
          setPopoverAnchorRect(null);
          isDeletingRef.current = false;
        }, 200);
      } else {
        // If deletion failed, restore the popover state
        isDeletingRef.current = false;
        setEditingCustomMode(customModes.find((cm) => cm._id === modeId));
      }
    } catch (err) {
      toast.error("Failed to delete mode");
      // If deletion failed, restore the popover state
      isDeletingRef.current = false;
      setEditingCustomMode(customModes.find((cm) => cm._id === modeId));
    }
  };

  // Handle tab click for custom modes
  const handleTabClick = (event, mode) => {
    if (mode.isCustom && mode.value === selectedMode) {
      setPopoverAnchor(event.currentTarget);
      try {
        const rect = event.currentTarget.getBoundingClientRect();
        setPopoverAnchorRect(rect);
      } catch (_) {
        // ignore
      }
      setEditingCustomMode(customModes.find((cm) => cm._id === mode.id));
    }
  };

  // Open custom mode creation modal
  const handleOpenCustomModeModal = () => {
    // Redirect to pricing if user is not logged in or on free plan
    if (!accessToken || userPackage === "free") {
      router.push("/pricing?redirect=/paraphrase");
      return;
    }

    clearError();
    setCustomModeModalOpen(true);
    // handleMoreClose(); // Close the More menu
  };

  // 

  return (
    <>
      <div className="flex items-center justify-between gap-2 pr-2">
        {/* Modes */}
        <div className="relative flex items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 md:gap-3 [&::-webkit-scrollbar]:hidden">
          <Tabs
            value={tabsValue}
            onValueChange={(v) => {
              const mode = displayedModes.find((m) => m?.value === v);
              if (mode) {
                // Find the tab element to pass as event - use more specific selector
                const tabElement =
                  document.querySelector(
                    `button[role="tab"][data-state="active"][value="${v}"], [data-state="active"][value="${v}"]`,
                  ) || document.querySelector(`[value="${v}"]`);
                const syntheticEvent = tabElement
                  ? { currentTarget: tabElement }
                  : null;
                changeMode(v, mode?.isCustom, mode?.id, syntheticEvent);
              }
            }}
          >
            <TabsList className="h-auto gap-0 bg-transparent p-0">
              {displayedModes.map((mode, idx) => (
                <TooltipProvider key={mode.id || idx}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value={mode.value}
                        onClick={(e) => {
                          handleTabClick(e, mode);
                          // Also pass event to changeMode if it's a custom mode click
                          if (mode.isCustom && mode.value === selectedMode) {
                            // handleTabClick already handles this case
                            return;
                          }
                        }}
                        className={cn(
                          "group relative px-3 text-sm md:px-4 xl:px-5",
                          "font-normal text-[#637381]",
                          "cursor-pointer py-3 data-[state=active]:bg-transparent data-[state=active]:text-[#00AB55] data-[state=active]:shadow-none",
                        )}
                        disabled={isLoading}
                      >
                        <span
                          className={`inline-flex items-center gap-1 ${mode.value === selectedMode ? "text-[#00AB55]" : "text-[#858481]"}`}
                        >
                          {!mode.package.includes(effectivePackage) && (
                            <Lock className="h-3 w-3" />
                          )}
                          {mode.value}
                          {mode.isCustom && <Pencil className="h-3 w-3" />}
                        </span>
                      </TabsTrigger>
                    </TooltipTrigger>
                    {/* <TooltipContent side="bottom" className="max-w-[190px]">
                      <p className="text-sm">
                        {mode.isCustom
                          ? "Custom mode - Click to edit"
                          : freezeTooltip}
                      </p>
                    </TooltipContent> */}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </TabsList>
          </Tabs>

          {/* More */}
          <div id="mode_more_section" className="shrink-0">
            <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="cursor-pointer text-[#858481] hover:bg-transparent"
                >
                  More
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px]">
                {extraModes.map((mode) => (
                  <DropdownMenuItem
                    key={mode.id || mode.value}
                    onClick={() =>
                      changeMode(mode.value, mode.isCustom, mode.id)
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      {!mode.package.includes(effectivePackage) && (
                        <Lock className="h-3 w-3" />
                      )}
                      {mode.isCustom && (
                        <Pencil className="text-primary h-3 w-3" />
                      )}
                      <span>{mode.value}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
                <div
                  className={cn(
                    "mt-1 border-t pt-1",
                    extraModes.length === 0 && "hidden",
                  )}
                ></div>
                <DropdownMenuItem onClick={handleOpenCustomModeModal}>
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Custom Mode</span>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Synonyms slider */}
        <div className="relative w-full max-w-32 min-w-0 md:max-w-52">
          <StepRange
            value={selectedSynonyms}
            onChange={(newValue) => {
              // Find the key for this label value
              const levelKey = Object.keys(SYNONYMS).find(
                (k) => SYNONYMS[k] === newValue,
              );
              const level = Number(levelKey);

              setSelectedSynonyms(newValue);
            }}
            steps={synonymSteps}
            className="w-full"
          />
        </div>
      </div>

      {/* Custom Mode Creation Modal */}
      <CustomModeModal
        open={customModeModalOpen}
        onClose={() => {
          setCustomModeModalOpen(false);
          clearError();
        }}
        recentModes={recentModes}
        recommendedModes={recommendedModes}
        onSubmit={handleCreateCustomMode}
        error={customModeError}
        isLoading={isCreatingMode}
      />

      {/* Custom Mode Edit Popover */}
      <CustomModePopover
        anchorEl={
          popoverAnchor ||
          (popoverAnchorRect
            ? { getBoundingClientRect: () => popoverAnchorRect }
            : null)
        }
        open={Boolean(editingCustomMode)}
        onClose={() => {
          // Delay clearing anchor to avoid popover snapping to top-left before unmount
          setTimeout(() => {
            // Don't interfere if we're in deletion flow (deletion handler manages cleanup)
            if (isDeletingRef.current) {
              return;
            }
            // Normal close - clear everything
            setPopoverAnchor(null);
            setEditingCustomMode(null);
            setPopoverAnchorRect(null);
            clearError();
          }, 120);
        }}
        modeName={editingCustomMode?.name || ""}
        recentModes={recentModes}
        recommendedModes={recommendedModes}
        onUpdate={handleUpdateCustomMode}
        onDelete={handleDeleteCustomMode}
        error={customModeError}
        isLoading={false}
      />
    </>
  );
};

export default ModeNavigation;
