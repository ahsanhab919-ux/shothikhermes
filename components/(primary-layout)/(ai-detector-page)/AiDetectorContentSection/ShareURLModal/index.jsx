import ButtonCopyText from "@/components/buttons/ButtonCopyText";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
} from "react-share";

const ShareURLModal = ({ open, handleClose, title, hashtags, history }) => {
  if (!history?._id) return null;

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/ai-detector?share_id=${history._id}`;
  let outputContend = "";

  history?.result?.sentences.forEach((item) => {
    outputContend += ` ${item.sentence}`;
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Share</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative w-full">
            <Input value={shareUrl} readOnly className="pr-12" />
            <div className="absolute top-1/2 right-2 -translate-y-1/2">
              <ButtonCopyText text={shareUrl} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FacebookShareButton
              url={shareUrl}
              quote={title}
              hashtag={`#${hashtags[0]}`}
              content={outputContend}
            >
              <FacebookIcon size={32} round />
            </FacebookShareButton>

            <TwitterShareButton
              url={shareUrl}
              title={title}
              hashtags={hashtags}
            >
              <TwitterIcon size={32} round />
            </TwitterShareButton>

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
      </DialogContent>
    </Dialog>
  );
};

export default ShareURLModal;
