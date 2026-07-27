"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, X } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl bg-black p-0"
        aria-describedby="video-dialog-description"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close video dialog"
          className="absolute top-2 right-2 z-10 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          data-testid="button-close-video"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="relative w-full pt-[56.25%]">
          <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center bg-black">
            <div className="p-8 text-center text-white">
              <Play className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <h2 id="video-dialog-title" className="text-body1 mb-2">
                Video player will be integrated here
              </h2>
              <p
                id="video-dialog-description"
                className="text-body2 text-gray-400"
              >
                Replace with YouTube embed, Vimeo, or direct video source
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
