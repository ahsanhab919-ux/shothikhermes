// components/plagiarism/Sidebar.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronDown, History, Scale, X } from "lucide-react";

const PlagiarismSidebar = ({
  open,
  onClose,
  score = 0,
  results = [],
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "bg-background box-border h-full w-[300px] overflow-y-auto shadow-sm",
      )}
    >
      {/* Top Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex gap-2">
          <Scale className="text-muted-foreground h-4 w-4" />
          <History className="text-muted-foreground h-4 w-4" />
        </div>
        <Button onClick={onClose} variant="ghost" size="icon-sm">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Title */}
      <div className="px-4">
        <h6 className="text-lg font-bold">Plagiarism Checker</h6>
        <Separator className="my-4" />

        {/* Score Card */}
        <Card className="bg-muted/50 shadow-sm mb-4 p-4 text-center rounded-xl">
          <h2 className="text-4xl font-bold">{score}%</h2>
          <p className="text-muted-foreground text-xs">Plagiarism</p>
        </Card>

        {/* Results */}
        {results.length === 0 ? (
          <Card className="bg-muted/50 shadow-sm p-4 text-center rounded-xl">
            <p className="text-muted-foreground text-sm">
              Run plagiarism check to see results
            </p>
          </Card>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium">Results ({results.length})</p>
            {results.map((r, i) => (
              <div
                key={i}
                className="border-border mb-2 flex items-center justify-between rounded-md border p-2"
              >
                <span className="w-[20%] text-sm">{r.percent}%</span>
                <span className="ml-2 flex-1 text-center text-sm">{r.source}</span>
                <Button variant="ghost" size="icon-sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default PlagiarismSidebar;
