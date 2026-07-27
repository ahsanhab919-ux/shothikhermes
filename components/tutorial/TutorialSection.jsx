import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

export const IconWrapper = ({ children, className }) => {
  return (
    <div
      className={cn(
        "[&_svg]:text-foreground flex h-[30px] w-[30px] items-center justify-center rounded-full [&_svg]:h-6 [&_svg]:w-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

const TutorialSection = ({
  tool,
  onVideoClick,
  subscriberCount,
  loading,
  handleSubscribe,
  formatSubscriberCount,
}) => {
  const [currentVideo, setCurrentVideo] = useState(null);

  const handleVideoClick = (videoUrl) => {
    // Extract video ID from URL if it's a full URL
    let videoId = videoUrl;
    if (videoUrl.includes("youtube.com/embed/")) {
      videoId = videoUrl.split("youtube.com/embed/")[1];
    }
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    setCurrentVideo(embedUrl);
    if (onVideoClick) onVideoClick(videoId);
  };

  // Set initial video
  useEffect(() => {
    if (tool?.videoId) {
      handleVideoClick(tool.videoId);
    }
  }, [tool]);

  return (
    <div className="mx-auto max-w-[1200px] pb-10 fade-in duration-500 animate-in pt-6">
      <div className="bg-transparent">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            <div className="group relative mb-6 h-0 w-full overflow-hidden rounded-xl bg-black/5 pb-[56.25%] shadow-xl ring-1 ring-white/10 transition-all hover:shadow-2xl md:w-auto">
              {currentVideo ? (
                <iframe
                  src={currentVideo}
                  className="absolute top-0 left-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute top-0 left-0 flex h-full w-full flex-col items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              )}
            </div>

            <div className="space-y-4">
               <div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">{tool.title}</h3>
                  <p className="text-muted-foreground mt-2 text-lg leading-relaxed">
                    {tool.description}
                  </p>
               </div>

              <div className="mt-8 rounded-xl border bg-card/50 p-6 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  {loading ? (
                    <div className="flex w-full gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-[140px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-md" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                            <Image
                            src="/green_tick.svg"
                            width={48}
                            height={48}
                            alt="Shothik AI"
                            className="drop-shadow-sm"
                            />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-foreground">Shothik AI</p>
                          <p className="text-muted-foreground text-sm font-medium">
                            {formatSubscriberCount(subscriberCount)} subscribers
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSubscribe}
                        variant="destructive"
                        size="lg"
                        className="w-full shadow-md transition-transform hover:scale-105 active:scale-95 sm:w-auto"
                      >
                        Subscribe Now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[380px]">
            <div className="rounded-xl border bg-card/50 p-1 shadow-sm backdrop-blur-sm">
              <div className="p-4">
                <div
                    onClick={() => handleVideoClick(tool.videoId)}
                    className="flex cursor-pointer items-center gap-4 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ring-1 ring-inset ring-black/5",
                      )}
                      style={
                        tool.iconColor ? { backgroundColor: `${tool.iconColor}20`, color: tool.iconColor } : {}
                      }
                    >
                      {tool.icon}
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground">
                        {tool.name}
                        </h3>
                        <p className="text-xs font-semibold text-primary">
                            Featured Tutorial
                        </p>
                    </div>
                  </div>
              </div>

              <Separator className="bg-border/50" />
              
              <div className="p-4">
                 <h4 className="mb-4 text-xs font-bold font-mono tracking-wider text-muted-foreground uppercase ml-2">
                  Up Next
                </h4>
                <div className="space-y-1">
                  {tool.tutorials.map((tutorial, index) => (
                    <div
                      key={index}
                      onClick={() => handleVideoClick(tutorial.videoLink)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-all hover:bg-accent hover:shadow-sm"
                    >
                      <div className="relative flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full bg-background ring-1 ring-border transition-colors group-hover:border-primary/50 group-hover:ring-primary/20">
                          <div className="h-2 w-2 rounded-full bg-primary/50" style={tool.iconColor ? { backgroundColor: tool.iconColor } : {}} />
                      </div>
                      <span className="line-clamp-2 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                        {tutorial.name}
                      </span>
                      <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialSection;
