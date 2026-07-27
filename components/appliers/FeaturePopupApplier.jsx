"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  setFeaturesWithCredentials,
  setFeaturesLoading,
} from "@/redux/slices/features-with-credentials-slice";
import { fetchPublicFeaturesWithPopups } from "@/services/feature.service";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

const FeaturePopupApplier = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { features } = useSelector((state) => state.features_with_credentials);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [popup, setPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const delayTimeoutRef = useRef(null);
  const durationTimeoutRef = useRef(null);

  // Effect 1: Fetch all features with popups on mount
  const { data: featuresResponse, isLoading: featuresQueryLoading } = useQuery({
    queryKey: ["features", "public", "with-popups"],
    queryFn: async () => {
      return fetchPublicFeaturesWithPopups({
        is_active: true,
        limit: 1000, // Large limit to get all features
        page: 1,
      });
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });

  // Update Redux state when features data changes
  useEffect(() => {
    if (featuresResponse?.data) {
      dispatch(setFeaturesWithCredentials(featuresResponse.data));
    }
  }, [featuresResponse?.data, dispatch]);

  // Sync loading state
  useEffect(() => {
    dispatch(setFeaturesLoading(featuresQueryLoading));
  }, [featuresQueryLoading, dispatch]);

  // Effect 2: Match pathname and show popup
  useEffect(() => {
    if (!features || features.length === 0) return;
    if (!pathname) return;

    // Find feature by matching path
    const matchedFeature = features.find(
      (f) => f.path && pathname.startsWith(f.path),
    );

    if (!matchedFeature) {
      setCurrentFeature(null);
      setPopup(null);
      setIsOpen(false);
      return;
    }

    setCurrentFeature(matchedFeature);

    // Find active popups for this feature and sort by priority (higher first)
    const activePopups = matchedFeature.popups?.filter(
      (p) => p.is_active === true,
    ) || [];

    if (activePopups.length === 0) {
      setPopup(null);
      setIsOpen(false);
      return;
    }

    // Sort by priority (descending - higher priority first)
    const sortedPopups = [...activePopups].sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA;
    });

    // Get the highest priority popup that hasn't been shown
    let selectedPopup = null;
    for (const p of sortedPopups) {
      const sessionKey = `popup_${p._id}`;
      const hasShown = sessionStorage.getItem(sessionKey) === "true";

      if (hasShown && p.category === "single-time") {
        continue; // Skip single-time popups that have been shown
      }

      selectedPopup = p;
      break;
    }

    if (!selectedPopup) {
      setPopup(null);
      setIsOpen(false);
      return;
    }

    // Clear any existing timeouts
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    if (durationTimeoutRef.current) {
      clearTimeout(durationTimeoutRef.current);
      durationTimeoutRef.current = null;
    }

    setPopup(selectedPopup);

    // Handle delay
    const delay = selectedPopup.delay ?? 0;
    if (delay > 0) {
      // Set isOpen to false initially when there's a delay
      setIsOpen(false);
      delayTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
        // Mark as shown in sessionStorage when actually shown
        const sessionKey = `popup_${selectedPopup._id}`;
        sessionStorage.setItem(sessionKey, "true");

        // Handle duration (auto-close)
        const duration = selectedPopup.duration ?? 0;
        if (duration > 0) {
          durationTimeoutRef.current = setTimeout(() => {
            setIsOpen(false);
          }, duration * 1000);
        }
      }, delay * 1000);
    } else {
      // Show immediately
      setIsOpen(true);
      // Mark as shown in sessionStorage
      const sessionKey = `popup_${selectedPopup._id}`;
      sessionStorage.setItem(sessionKey, "true");

      // Handle duration (auto-close)
      const duration = selectedPopup.duration ?? 0;
      if (duration > 0) {
        durationTimeoutRef.current = setTimeout(() => {
          setIsOpen(false);
        }, duration * 1000);
      }
    }

    // Cleanup on unmount or when popup changes
    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }
      if (durationTimeoutRef.current) {
        clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = null;
      }
    };
  }, [pathname, features]);

  const handleClose = () => {
    setIsOpen(false);
    // Clear duration timeout when manually closed
    if (durationTimeoutRef.current) {
      clearTimeout(durationTimeoutRef.current);
      durationTimeoutRef.current = null;
    }
  };

  const handleActionClick = (action) => {
    if (action.type === "link" && action.path) {
      // Handle link navigation
      if (action.path.startsWith("http://") || action.path.startsWith("https://")) {
        window.open(action.path, "_blank", "noopener,noreferrer");
      } else {
        // Internal route navigation
        router.push(action.path);
      }
      handleClose();
    } else {
      // Handle other action types (custom logic)
      // You can add custom handler logic here
    }
  };

  if (!popup) return null;

  // Get modal size class
  const getSizeClass = (size) => {
    switch (size) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-2xl";
      case "lg":
        return "max-w-4xl";
      case "xl":
        return "max-w-6xl";
      case "full":
        return "max-w-[95vw] max-h-[95vh]";
      default:
        return "max-w-2xl";
    }
  };

  // Group actions by position
  const headerActions = popup.actions?.filter((a) => a.position === "header") || [];
  const contentActions = popup.actions?.filter((a) => a.position === "content" || !a.position) || [];
  const footerActions = popup.actions?.filter((a) => a.position === "footer") || [];

  // Map variant to button variant
  const getButtonVariant = (variant) => {
    switch (variant) {
      case "primary":
        return "default";
      case "secondary":
        return "secondary";
      case "outline":
        return "outline";
      case "destructive":
        return "destructive";
      case "link":
        return "link";
      default:
        return "default";
    }
  };

  // Map size to button size
  const getButtonSize = (size) => {
    switch (size) {
      case "sm":
        return "sm";
      case "lg":
        return "lg";
      case "icon":
      case "icon-sm":
      case "icon-lg":
        return "icon";
      case "full":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          getSizeClass(popup.size || "md"),
          "max-h-[90vh] overflow-y-auto",
        )}
      >
        <DialogHeader>
          <DialogTitle>{popup.name}</DialogTitle>
          {/* Header Actions */}
          {headerActions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {headerActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  variant={getButtonVariant(action.variant)}
                  size={getButtonSize(action.size)}
                  className={cn(
                    "shrink-0",
                    action.size === "full" && "w-full",
                  )}
                >
                  {action.name}
                </Button>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {popup.image && (
            <img
              src={popup.image}
              alt={popup.name}
              className="w-full rounded-lg object-cover"
            />
          )}

          {popup.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {popup.description}
            </p>
          )}

          {popup.video && (
            <video
              src={popup.video}
              controls
              className="w-full rounded-lg"
            />
          )}

          {popup.content && (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(popup.content) }}
              className="prose prose-sm max-w-none dark:prose-invert"
            />
          )}

          {/* Content Actions */}
          {contentActions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4">
              {contentActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  variant={getButtonVariant(action.variant)}
                  size={getButtonSize(action.size)}
                  className={cn(
                    "shrink-0",
                    action.size === "full" && "w-full",
                  )}
                >
                  {action.name}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {footerActions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {footerActions.map((action, index) => (
              <Button
                key={index}
                onClick={() => handleActionClick(action)}
                variant={getButtonVariant(action.variant)}
                size={getButtonSize(action.size)}
                className={cn(
                  "flex-shrink-0",
                  action.size === "full" && "w-full",
                )}
              >
                {action.name}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeaturePopupApplier;

