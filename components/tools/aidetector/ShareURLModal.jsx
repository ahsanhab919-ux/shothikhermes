import CopyButton from "@/components/(secondary-layout)/(blogs-page)/details/CopyButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
} from "react-share";

const ShareURLModal = ({ open, handleClose, title, hashtags, content }) => {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ai-detector?share_id=${content._id}`;
  let outputContend = "";

  content.sentences.forEach((item) => {
    outputContend += ` ${item.sentence}`;
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent showCloseButton={false} className={cn("max-w-xs")}>
        <div className="relative flex flex-col items-center justify-center gap-4 px-4 py-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-0 right-0"
          >
            <X className="size-4" />
          </Button>

          <h2 className="text-xl font-semibold">Share</h2>
          <div className="relative w-full">
            <Input value={shareUrl} readOnly className={cn("pr-10")} />
            <div className="absolute top-1/2 right-1 -translate-y-1/2">
              <CopyButton text={shareUrl} />
            </div>
          </div>
          <div className="flex flex-row items-center gap-1">
            <div>
              <FacebookShareButton
                url={shareUrl}
                quote={title}
                hashtag={`#${hashtags[0]}`}
                content={outputContend}
              >
                <FacebookIcon size={32} round />
              </FacebookShareButton>
            </div>
            <div>
              <TwitterShareButton
                url={shareUrl}
                title={title}
                hashtags={hashtags}
              >
                <TwitterIcon size={32} round />
              </TwitterShareButton>
            </div>
            <div>
              <LinkedinShareButton
                url={shareUrl}
                title={title}
                summary={outputContend}
                source={process.env.NEXT_PUBLIC_APP_URL}
              >
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareURLModal;
