import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function TaskProgress({ taskProgress }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };

  const taskDone = taskProgress.filter((item) => item?.status === "success");

  return (
    <div className="absolute right-4 bottom-4 left-4">
      <div
        className={cn(
          "border-border bg-card text-card-foreground rounded-lg border px-4 shadow-sm",
          expanded ? "py-4" : "py-1",
        )}
      >
        {expanded ? (
          <>
            <h3 className="mb-2 text-base font-bold">Task progress</h3>
            <div className="space-y-1">
              {taskProgress.map((task, index) => (
                <div key={index} className="flex min-h-0 items-center gap-3">
                  <CheckCircle2
                    className={cn(
                      "shrink-0",
                      task?.status === "success"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    size={20}
                  />
                  <span className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                    {task?.name}
                  </span>
                </div>
              ))}
            </div>

            <button
              className="hover:bg-accent absolute right-2 bottom-2 inline-flex items-center justify-center rounded-md p-1 transition-colors outline-none"
              onClick={toggleExpanded}
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
              {taskProgress[taskProgress.length - 1]?.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {taskDone.length}/{taskProgress.length}
              </span>
              <button
                className="hover:bg-accent inline-flex items-center justify-center rounded-md p-1 transition-colors outline-none"
                onClick={toggleExpanded}
              >
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
