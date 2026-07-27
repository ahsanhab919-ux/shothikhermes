"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const SourcesGrid = ({ sources, onViewAllSources }) => {
  if (!sources || sources.length === 0) return null;

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

  const handleSourceClick = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mt-2 mb-3">
      <h6 className="text-foreground mb-2 text-lg font-semibold">
        Sources ({sources.length})
      </h6>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 md:grid-cols-3">
        {sources.slice(0, 6).map((source, index) => (
          <Card
            key={index}
            className="flex h-full cursor-pointer flex-col transition-all duration-200 ease-in-out hover:-translate-y-px hover:shadow-md"
            onClick={() => handleSourceClick(source.url)}
          >
            <CardContent className="flex-grow p-2">
              <div className="flex items-start gap-1.5">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={getFaviconUrl(source.url)} />
                  <AvatarFallback className="bg-muted text-foreground text-[0.7rem]">
                    {getDomainAbbr(source.url)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-foreground mb-0.5 line-clamp-2 text-sm leading-snug font-medium">
                    {source.title || "Untitled Source"}
                  </p>

                  <span className="text-muted-foreground block truncate text-xs">
                    {getDomain(source.url)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sources.length > 6 && (
        <span
          className="text-muted-foreground mt-1 block text-center text-xs cursor-pointer hover:text-primary transition-colors"
          onClick={onViewAllSources}
        >
          +{sources.length - 6} more sources available
        </span>
      )}
    </div>
  );
};

export default SourcesGrid;
