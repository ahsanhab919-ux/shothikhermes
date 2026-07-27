"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const ReferenceModal = ({ open, onClose, reference, sources, anchorEl }) => {
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open, onClose]);

  if (!reference || !sources) return null;

  // Find sources that match this reference number
  const matchingSources = sources.filter(
    (source) => source.reference === reference,
  );

  const handleOpenUrl = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Function to get domain from URL
  const getDomain = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Function to get favicon URL
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Function to get domain abbreviation
  const getDomainAbbr = (url) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      const parts = domain.split(".");
      if (parts.length >= 2) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return domain.substring(0, 2).toUpperCase();
    } catch {
      return "??";
    }
  };

  if (!open) return null;

  const getPosition = () => {
    if (!anchorEl || !anchorEl.getBoundingClientRect)
      return { top: 0, left: 0 };
    const rect = anchorEl.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
    };
  };

  const position = getPosition();

  return (
    <div
      ref={modalRef}
      className="fixed z-[1300]"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseLeave={onClose}
    >
      <div className="border-border bg-popover max-h-[250px] max-w-[350px] min-w-[280px] rounded-md border shadow-lg">
        <div className="border-border border-b px-2 py-1.5">
          <span className="text-foreground text-xs font-semibold">
            Sources {matchingSources.length}
          </span>
        </div>

        {matchingSources.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center p-2 text-center">
            <span className="text-muted-foreground text-sm">
              No sources found
            </span>
          </div>
        ) : (
          <div className="max-h-[200px] overflow-auto p-0">
            {matchingSources.map((source, index) => (
              <div
                key={index}
                className={cn(
                  "hover:bg-accent flex cursor-pointer items-center gap-2 px-2 py-2",
                  index < matchingSources.length - 1 &&
                    "border-border/50 border-b",
                )}
                onClick={() => handleOpenUrl(source.url)}
              >
                <Avatar className="h-[18px] w-[18px]">
                  <AvatarImage src={getFaviconUrl(source.url)} />
                  <AvatarFallback className="bg-muted text-foreground text-[0.6rem]">
                    {getDomainAbbr(source.url)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-foreground line-clamp-1 text-xs leading-tight font-normal">
                    {source.title || "Untitled Source"}
                  </span>
                  <span className="text-muted-foreground truncate text-[0.65rem]">
                    {getDomain(source.url)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceModal;
