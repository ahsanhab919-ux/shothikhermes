import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const AnimatedChecklist = ({ isLoading = true }) => {
  const getInitialItems = () => [
    { id: 1, text: "Analyzing the Text", checked: false },
    { id: 2, text: "Detecting AI Patterns", checked: false },
    { id: 3, text: "Understanding Semantics", checked: false },
    { id: 4, text: "Recalibrating Tone", checked: false },
    { id: 5, text: "Restructuring Sentences", checked: false },
    { id: 6, text: "Diversifying Word Choice", checked: false },
    { id: 7, text: "Rewriting for Context", checked: false },
    { id: 8, text: "Optimizing Flow and Coherence", checked: false },
    { id: 9, text: "Rechecking AI Detectability", checked: false },
    { id: 10, text: "Polishing Grammar and Style", checked: false },
    { id: 11, text: "Scoring Output Quality", checked: false },
  ];

  const [items, setItems] = useState(getInitialItems);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const timeoutRef = useRef(null);

  // Reset component state when loading starts (isLoading becomes true)
  useEffect(() => {
    if (isLoading) {
      setItems(getInitialItems());
      setCurrentIndex(0);
      setScrollOffset(0);
    }
  }, [isLoading]);

  useEffect(() => {
    // Stop animation if not loading
    if (!isLoading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Calculate step duration based on total items (spread over time)
    // Each step takes ~800ms, so all 11 steps take ~8.8 seconds
    // If loading takes longer, it will loop
    const stepDuration = 800;

    const checkTimeout = setTimeout(() => {
      // Ensure currentIndex is always valid
      const validIndex = Math.min(currentIndex, items.length - 1);
      
      // Mark current item as checked
      setItems((prevItems) => {
        const newItems = [...prevItems];
        if (validIndex >= 0 && validIndex < newItems.length) {
          newItems[validIndex].checked = true;
        }
        return newItems;
      });

      // After checking, move to next item and adjust scroll
      setTimeout(() => {
        setCurrentIndex((prev) => {
          // Ensure prev is valid
          const safePrev = Math.min(prev, items.length - 1);
          const next = safePrev + 1;
          
          // If we've completed all items and still loading, smoothly loop back to start
          if (next >= items.length) {
            // Reset items and scroll position immediately (synchronously) to prevent blank state
            setItems(getInitialItems());
            setScrollOffset(0);
            // Return 0 to start from the first item immediately (no blank state)
            return 0;
          }
          
          // Only scroll when the next item would be outside the visible range
          // We show maxVisibleItems (3) items at a time
          // Start scrolling only when we've checked maxVisibleItems items and need to show the next one
          if (next >= maxVisibleItems && next < items.length) {
            setScrollOffset((prevOffset) => {
              // Calculate the new offset to keep the current item visible
              // The current item should be at the bottom of the visible area
              const newOffset = next - maxVisibleItems + 1;
              // Don't scroll beyond the last visible items
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
  }, [currentIndex, items.length, isLoading]);

  const itemHeight = 62.5; // 250px / 4 items = 62.5px per item
  const maxVisibleItems = 3;

  return (
    <div className="flex max-h-[300px] items-center justify-center sm:p-8">
      <div className="relative w-full sm:max-w-md">
        <div className="overflow-hidden sm:p-6">
          <div className="relative h-[250px] overflow-hidden">
            {/* Top fade overlay */}
            <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-12 bg-linear-to-b from-slate-50/20 to-transparent dark:from-slate-900/0"></div>

            {/* Bottom fade overlay */}
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-12 bg-linear-to-t from-slate-50/20 to-transparent dark:from-slate-900/0"></div>

            {/* Scrollable content */}
            <motion.div
              animate={{
                y: -scrollOffset * itemHeight,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8,
              }}
              className="py-2 will-change-transform"
            >
              {items.map((item, index) => {
                const isCurrent = index === currentIndex && currentIndex < items.length;
                const isPast = index < currentIndex;
                const visibleStart = scrollOffset;
                const visibleEnd = scrollOffset + maxVisibleItems;
                const isInView = index >= visibleStart && index < visibleEnd;

                return (
                  <motion.div
                    key={item.id}
                    className="flex items-center gap-3 px-4"
                    style={{ height: `${itemHeight}px` }}
                    animate={{
                      opacity: isInView ? 1 : 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        item.checked
                          ? "border-emerald-500 bg-emerald-500"
                          : isCurrent
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-slate-300 bg-white"
                      }`}
                      animate={{
                        scale: item.checked
                          ? [1, 1.2, 1]
                          : isCurrent
                            ? [1, 1.1, 1]
                            : 1,
                      }}
                      transition={{
                        duration: item.checked ? 0.4 : 1.5,
                        repeat: isCurrent && !item.checked ? Infinity : 0,
                        repeatType: "reverse",
                      }}
                    >
                      <AnimatePresence>
                        {item.checked && (
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
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.span
                      className={`text-sm font-medium transition-all duration-300 ${
                        item.checked
                          ? "text-emerald-600"
                          : isCurrent
                            ? "text-slate-800"
                            : isPast
                              ? "text-slate-400"
                              : "text-slate-500"
                      }`}
                      animate={{
                        x: item.checked ? [0, 2, 0] : 0,
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >
                      {item.text}
                    </motion.span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedChecklist;
