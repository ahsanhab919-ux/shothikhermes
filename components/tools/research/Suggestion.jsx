import { cn } from "@/lib/utils";
import { AlignLeft } from "lucide-react";
import * as motion from "motion/react-client";

const Suggestion = ({ handleSuggestedQuestionClick, suggestedQuestions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="my-2 flex items-center gap-2">
        <AlignLeft className="text-muted-foreground h-4 w-4" />
        <h6 className="text-lg leading-none font-semibold tracking-tight">
          Suggested questions
        </h6>
      </div>

      <div className="flex flex-col gap-1">
        {suggestedQuestions?.map((question, index) => (
          <span
            key={index}
            className={cn(
              "rounded-3xl px-4 py-2 font-medium",
              "bg-card text-muted-foreground",
              "w-fit cursor-pointer",
              "hover:bg-accent hover:text-accent-foreground",
              "transition-colors",
            )}
            onClick={() => handleSuggestedQuestionClick(question)}
          >
            {question}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

export default Suggestion;
