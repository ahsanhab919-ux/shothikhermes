import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import * as motion from "motion/react-client";

const AttachmentPreview = ({ attachment, isUploading, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="bg-background relative flex w-auto items-center gap-1 rounded-lg p-2 pr-4 shadow-sm"
    >
      {isUploading ? (
        <div className="flex h-10 w-10 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <Avatar className="h-10 w-10 rounded-lg">
          <AvatarImage src={attachment.url} alt="Image preview" />
        </Avatar>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-background border-border hover:bg-muted absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
};

export default AttachmentPreview;
