"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function PolicyNavigation({ items = [] }) {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = items
        .map((item) => {
          const element = document.getElementById(item.id);
          return element
            ? {
                id: item.id,
                top: element.getBoundingClientRect().top,
              }
            : null;
        })
        .filter(Boolean);

      const currentSection = sections.find(
        (section, index) =>
          section.top <= 100 &&
          (index === sections.length - 1 || sections[index + 1].top > 100),
      );

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (!element) return;

    // Find the main content container (flex-1 div that contains breadcrumb and content)
    const mainContentDiv = element
      .closest(".container")
      ?.querySelector(".flex-1");
    if (!mainContentDiv) {
      // Fallback
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      return;
    }

    // Get the breadcrumb container
    const breadcrumbContainer = mainContentDiv.querySelector(
      "[data-breadcrumb-container]",
    );
    if (!breadcrumbContainer) {
      // Fallback
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      return;
    }

    // Get positions (getBoundingClientRect gives viewport-relative positions)
    const breadcrumbRect = breadcrumbContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate: we want element to appear right after breadcrumb with 16px spacing
    // Target viewport position = breadcrumb bottom + 16px spacing
    // Scroll position = element's document position - target viewport position
    const targetViewportPosition = breadcrumbRect.bottom + 16;
    const elementDocumentTop = elementRect.top + window.pageYOffset;
    const targetScroll = elementDocumentTop - targetViewportPosition;

    // Scroll to calculated position
    window.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: "smooth",
    });

    // Update active section
    setActiveSection(id);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-16 z-20 w-full lg:top-24 lg:w-auto">
      <div className="bg-muted/50 border-border rounded-lg border">
        <div className="p-3 sm:p-4">
          <h3 className="text-foreground mb-2 hidden text-sm font-semibold lg:block">
            Table of Contents
          </h3>
        </div>
        <div className="max-h-[60vh] overflow-y-auto lg:max-h-[70vh]">
          <nav className="space-y-1 px-3 pb-3 sm:space-y-2 sm:px-4 sm:pb-4">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "text-foreground hover:text-primary flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm transition-colors sm:py-2.5 sm:text-sm",
                  "min-h-[44px] touch-manipulation", // Touch-friendly sizing
                  activeSection === item.id
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : index === 0
                      ? "text-foreground font-bold"
                      : "text-muted-foreground font-normal",
                )}
              >
                <span className="flex-1 truncate pr-2">{item.label}</span>
                <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0 shrink-0" />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}