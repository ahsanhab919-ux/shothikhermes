import { MessageBubble } from "@/components/ui/message-bubble";
import { cn } from "@/lib/utils";
import { FileImage, FileText } from "lucide-react";
import { motion } from "motion/react";

export default function UserMessage({ message }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-end"
    >
      <MessageBubble
        message={message.message}
        variant="sent"
        className="max-w-[70%] px-6 py-4 text-base"
      />
      <div className="mt-2 flex flex-wrap items-center justify-end gap-4">
        {message.files
          ? Array.from(message.files).map((file, index) => (
              <div
                key={index}
                className="border-border bg-card text-card-foreground flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm"
              >
                {file.name.includes(".pdf") ? (
                  <FileText className="text-destructive size-5" />
                ) : (
                  <FileImage className="text-primary size-5" />
                )}
                <span className="text-sm">{file.name}</span>
              </div>
            ))
          : null}
      </div>
    </motion.div>
  );
}
