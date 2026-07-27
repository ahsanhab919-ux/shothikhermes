"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

const ImageCard = ({ image, onClick }) => (
  <Card
    className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg py-0"
    onClick={() => onClick(image)}
  >
    <div className="bg-muted relative h-[200px] overflow-hidden">
      <img
        src={image.url || image.thumbnail_url }
        alt={image.alt_text || image.title}
        className="h-full w-full object-cover object-center"
        //onError={(e) => {
          //e.target.src = "/placeholder-image.png";
        //}}
      />
    </div>
    <CardContent className="p-2">
      <p className="mb-1 line-clamp-2 text-sm font-medium">{image.title}</p>

      <p className="text-muted-foreground mb-1 block text-xs">
        Source: {image.source}
      </p>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[0.7rem]">
          {image.width} × {image.height}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            window.open(image.context_url, "_blank");
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ImageModal = ({ image, open, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between pr-6">
          {image?.title}
        </DialogTitle>
      </DialogHeader>

      {image && (
        <div>
          <img
            src={image.url}
            alt={image.alt_text || image.title}
            className="bg-muted h-auto max-h-[70vh] w-full rounded-lg object-contain"
            //onError={(e) => {
              //e.target.src = "/placeholder-image.png";
            //}}
          />

          <div className="mt-2 space-y-1">
            <p className="text-muted-foreground text-sm">
              <strong>Source:</strong> {image.source}
            </p>

            <p className="text-muted-foreground text-sm">
              <strong>Dimensions:</strong> {image.width} × {image.height}
            </p>

            <p className="text-muted-foreground text-sm">
              <strong>Context:</strong>{" "}
              <a
                href={image.context_url}
                target="_blank"
                rel="noopener"
                className="text-primary underline hover:opacity-80"
              >
                View original page
              </a>
            </p>

            {image.relevance_score && (
              <p className="text-muted-foreground text-sm">
                <strong>Relevance:</strong>{" "}
                {Math.round(image.relevance_score * 100)}%
              </p>
            )}
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
);

export default function ImagesContent({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  if (!images || images.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
        <ImageIcon className="text-muted-foreground mb-2 h-16 w-16" />
        <h6 className="text-muted-foreground text-lg">No Images Available</h6>
        <p className="text-muted-foreground text-sm">
          No images were found for this research query
        </p>
      </div>
    );
  }

  return (
    <div className="mb-[4.25rem] min-h-[calc(100dvh-180px)] px-2 py-3 sm:mb-7 sm:min-h-[calc(100dvh-200px)] md:mb-5 md:min-h-[calc(100dvh-230px)] lg:min-h-[calc(100dvh-250px)]">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {images.map((image, index) => (
          <ImageCard
            key={image._id || index}
            image={image}
            onClick={handleImageClick}
          />
        ))}
      </div>

      <ImageModal
        image={selectedImage}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
