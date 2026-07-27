import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import * as motion from "motion/react-client";

const UserMessage = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("mb-1 flex flex-row items-center gap-1")}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="User"
        className={cn(
          "h-auto w-auto rounded-[5px] p-1.5",
          "bg-primary/5 text-muted-foreground",
        )}
      >
        <User className="h-5 w-5" />
      </Button>
      <span className="text-base">{message.content}</span>
    </motion.div>
  );
};

export default UserMessage;
