"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScanStep {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

interface ScanProgressProps {
  loading: boolean;
  elapsedTime?: number;
  estimatedTotalTime?: number;
}

const ScanProgress = ({ loading, elapsedTime = 0, estimatedTotalTime }: ScanProgressProps) => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const getInitialSteps = (): ScanStep[] => [
    {
      id: "initialize",
      label: t("tools.plagiarism.scanSteps.initializingLabel"),
      description: t("tools.plagiarism.scanSteps.initializingDesc"),
      checked: false,
    },
    {
      id: "chunking",
      label: t("tools.plagiarism.scanSteps.analyzingLabel"),
      description: t("tools.plagiarism.scanSteps.analyzingDesc"),
      checked: false,
    },
    {
      id: "searching",
      label: t("tools.plagiarism.scanSteps.searchingLabel"),
      description: t("tools.plagiarism.scanSteps.searchingDesc"),
      checked: false,
    },
    {
      id: "analyzing",
      label: t("tools.plagiarism.scanSteps.comparingLabel"),
      description: t("tools.plagiarism.scanSteps.comparingDesc"),
      checked: false,
    },
    {
      id: "generating",
      label: t("tools.plagiarism.scanSteps.generatingLabel"),
      description: t("tools.plagiarism.scanSteps.generatingDesc"),
      checked: false,
    },
  ];

  const [items, setItems] = useState<ScanStep[]>(getInitialSteps);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);

  const totalAnimationTime = estimatedTotalTime || 150;
  const stepCount = getInitialSteps().length;
  const stepDuration = (totalAnimationTime * 1000) / stepCount;

  useEffect(() => {
    if (loading) {
      setItems(getInitialSteps());
      setCurrentIndex(0);
      setScrollOffset(0);
      setAnimationComplete(false);
      animationStartTimeRef.current = Date.now();
    } else {
      animationStartTimeRef.current = null;
      setAnimationComplete(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    if (animationComplete) {
      return;
    }

    const checkTimeout = setTimeout(() => {
      const validIndex = Math.min(currentIndex, items.length - 1);

      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (validIndex >= 0 && validIndex < newItems.length) {
          newItems[validIndex].checked = true;
        }
        return newItems;
      });

      setTimeout(() => {
        setCurrentIndex((prev) => {
          const safePrev = Math.min(prev, items.length - 1);
          const next = safePrev + 1;

          const maxVisibleItems = 3;
          if (next >= items.length) {
            setAnimationComplete(true);
            const maxOffset = Math.max(0, items.length - maxVisibleItems);
            setScrollOffset(maxOffset);
            return items.length - 1;
          }

          if (next >= maxVisibleItems && next < items.length) {
            setScrollOffset(() => {
              const newOffset = next - maxVisibleItems + 1;
              const maxOffset = Math.max(0, items.length - maxVisibleItems);
              return Math.min(newOffset, maxOffset);
            });
          }
          return next;
        });
      }, 300);
    }, stepDuration);

    timeoutRef.current = checkTimeout;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, items.length, loading, animationComplete, stepDuration]);

  if (!loading) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const itemHeight = 80;
  const maxVisibleItems = 3;

  return (
    <Card className="bg-card shadow-sm" role="status" aria-live="polite" aria-label="Scan progress">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t("tools.plagiarism.scan.scanningInProgress")}</h3>
            <p className="text-muted-foreground text-sm">
              {t("tools.plagiarism.scan.analyzingContent")}
            </p>
          </div>
          {elapsedTime > 0 && (
            <div className="text-muted-foreground text-sm font-medium">
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-lg">
          <div className="relative h-[280px] overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-12 bg-gradient-to-b from-card to-transparent"></div>
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-gradient-to-t from-card to-transparent"></div>

            <motion.div
              animate={{
                y: -scrollOffset * itemHeight,
              }}
              transition={prefersReducedMotion ? { duration: 0 } : {
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className="py-2 will-change-transform"
            >
              {items.map((item, index) => {
                const isChecked = animationComplete 
                  ? index < items.length - 1 
                  : item.checked;
                const isCurrent = animationComplete 
                  ? index === items.length - 1 
                  : index === currentIndex && currentIndex < items.length;
                const visibleStart = scrollOffset;
                const visibleEnd = scrollOffset + maxVisibleItems;
                const isInView = index >= visibleStart && index < visibleEnd;

                return (
                  <motion.div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg p-4 transition-all",
                      isChecked && "bg-green-500/5",
                      isCurrent && !isChecked && "bg-primary/5",
                      !isCurrent && !isChecked && "bg-muted/30 opacity-60"
                    )}
                    style={{  marginBottom: "0.5rem" }}
                    animate={{
                      opacity: isInView ? 1 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                      <motion.div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                          isChecked
                            ? "border-emerald-500 bg-emerald-500"
                            : isCurrent
                              ? "border-primary bg-primary/10"
                              : "border-zinc-300 bg-white dark:bg-zinc-800"
                        )}
                        animate={prefersReducedMotion ? {} : {
                          scale: isChecked
                            ? [1, 1.2, 1]
                            : isCurrent
                              ? [1, 1.1, 1]
                              : 1,
                        }}
                        transition={prefersReducedMotion ? { duration: 0 } : {
                          duration: isChecked ? 0.4 : 1.5,
                          repeat: isCurrent && !isChecked ? Infinity : 0,
                          repeatType: "reverse",
                        }}
                      >
                        <AnimatePresence>
                          {isChecked ? (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 600,
                                damping: 20,
                              }}
                            >
                              <Check
                                className="h-3.5 w-3.5 text-white"
                                strokeWidth={3}
                              />
                            </motion.div>
                          ) : isCurrent ? (
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <motion.p
                          className={cn(
                            "font-medium",
                            isChecked && "text-emerald-600 dark:text-emerald-400",
                            isCurrent && !isChecked && "text-primary",
                            !isCurrent && !isChecked && "text-muted-foreground"
                          )}
                          animate={{
                            x: isChecked ? [0, 2, 0] : 0,
                          }}
                          transition={{
                            duration: 0.3,
                          }}
                        >
                          {item.label}
                        </motion.p>
                        {isCurrent && !isChecked && (
                          <span className="text-primary text-xs font-medium">
                            {animationComplete ? t("tools.plagiarism.scan.finalizing") : t("tools.plagiarism.scan.inProgress")}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm",
                          isCurrent || isChecked
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-muted-foreground text-xs">
            {t("tools.plagiarism.scan.estimatedTime")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanProgress;
