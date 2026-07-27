import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Search,
  X,
} from "lucide-react";
import * as motion from "motion/react-client";
import React from "react";

const PREVIEW_IMAGE_COUNT = 3;

const ImageGrid = ({ images, showAll = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const isMobile = useIsMobile();

  const displayImages = showAll
    ? images
    : images.slice(0, !isMobile ? 5 : PREVIEW_IMAGE_COUNT);
  const hasMore = images.length > (!isMobile ? 5 : PREVIEW_IMAGE_COUNT);

  const ImageViewer = () => {
    return (
      <div className="border-border relative flex h-full min-h-[400px] w-full items-center justify-center border sm:h-[600px] sm:w-[800px]">
        {/* Header */}
        <div className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between p-4">
          <div>
            <h6 className="text-lg font-semibold">Search Images</h6>
            <p className="text-muted-foreground text-sm">
              {selectedImage + 1} of {images.length}
            </p>
          </div>
          {/* close icon */}
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            aria-label="Close"
            className="absolute top-2 right-2 h-auto p-1"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Main Image */}
        <div className="absolute top-1/2 left-1/2 h-[60%] w-[70%] -translate-x-1/2 -translate-y-1/2">
          <img
            src={images[selectedImage].url}
            alt={images[selectedImage].description}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 left-5 -translate-y-1/2"
          onClick={() =>
            setSelectedImage((prev) =>
              prev === 0 ? images.length - 1 : prev - 1,
            )
          }
        >
          <ChevronLeft className="size-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-5 -translate-y-1/2"
          onClick={() =>
            setSelectedImage((prev) =>
              prev === images.length - 1 ? 0 : prev + 1,
            )
          }
        >
          <ChevronRight className="size-8" />
        </Button>

        {/* Description */}
        {images[selectedImage].description && (
          <div className="absolute right-0 bottom-0 left-0 p-4">
            <p className="text-foreground text-sm">
              {images[selectedImage].description}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Image Gallery Grid */}
      <div className="grid-rows-auto grid grid-cols-4 gap-2">
        {displayImages.map((image, index) => (
          <motion.div
            key={index}
            className={cn(
              "relative cursor-pointer overflow-hidden rounded-lg shadow-sm transition-all",
              index === 0 ? "col-span-2 row-span-2 h-[188px]" : "h-[90px]",
            )}
            onClick={() => {
              setSelectedImage(index);
              setIsOpen(true);
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <img
              src={image.url}
              alt={image.description}
              className="h-full w-full object-cover"
            />
            {image.description && (
              <div className="absolute inset-0 flex items-center bg-black/60 p-2 opacity-0 transition-opacity hover:opacity-100">
                <p className="line-clamp-3 text-xs text-white">
                  {image.description}
                </p>
              </div>
            )}
            {!showAll && index === (!isMobile ? 3 : 2) && hasMore && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-xs text-white">
                  +{images.length - (!isMobile ? 5 : 3)}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal Dialog for Image Viewer (Desktop) */}
      {!isMobile && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl rounded-none p-0 sm:max-w-5xl">
            <ImageViewer />
          </DialogContent>
        </Dialog>
      )}

      {/* Sheet for Mobile View */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            className="h-[80vh] w-full rounded-none p-0"
          >
            <ImageViewer />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

const WebSearch = ({ data }) => {
  return (
    <div className="flex w-full flex-col gap-2">
      <Accordion
        type="single"
        collapsible
        defaultValue="item-1"
        className="bg-card border-border overflow-hidden rounded-lg border"
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex w-full items-center justify-between pr-4">
              <div className="flex items-center gap-1">
                <Globe className="text-muted-foreground size-4" />
                <span className="font-medium">Sources Found</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-primary/5 text-muted-foreground font-medium"
              >
                <Search className="mr-1 size-3" />
                {data?.results?.length} Results
              </Badge>
            </div>
          </AccordionTrigger>
          <Separator />
          <AccordionContent className="bg-card rounded-b-lg p-4">
            {/* Query badges */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {data.queries?.map((query, i) => (
                <Badge key={i} variant="outline" className="shrink-0 px-2">
                  <Search className="mt-0.5 mr-1 size-3" />
                  {query}
                </Badge>
              ))}
            </div>

            {/* Horizontal scrolling results */}
            <div className="mt-4 flex flex-row gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {data.results?.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-card border-border w-[300px] shrink-0 rounded-lg border shadow-none transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${
                              new URL(result.url).hostname
                            }`}
                            alt=""
                            className="rounded-md"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='8' x2='12' y2='16'/%3E%3Cline x1='8' y1='12' x2='16' y2='12'/%3E%3C/svg%3E")
                            }
                          />
                          <AvatarFallback className="bg-muted rounded-md">
                            +
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h6 className="line-clamp-1 text-sm font-semibold">
                            {result.title}
                          </h6>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground flex items-center gap-1 text-xs hover:underline"
                          >
                            {new URL(result.url).hostname}
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                        {result.content}
                      </p>

                      {/* Published Date */}
                      {result.published_date && (
                        <>
                          <Separator />
                          <div className="mt-4 flex items-center gap-2">
                            <Calendar className="text-muted-foreground size-3.5" />
                            <span className="text-muted-foreground text-xs">
                              {new Date(
                                result.published_date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Images section outside accordion */}
      {data.images?.length > 0 && <ImageGrid images={data.images} />}
    </div>
  );
};

export default WebSearch;
