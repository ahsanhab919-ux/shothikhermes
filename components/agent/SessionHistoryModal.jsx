import DotFlashing from "@/components/common/DotFlashing";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { FileText, ListTodo } from "lucide-react";

const SessionHistoryModal = ({
  open,
  setOpen,
  data,
  isLoading,
  setSessionHistoryId,
}) => {
  const isMobile = useResponsive("down", "sm");
  const histories = data?.data;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className={cn(
          "w-full overflow-y-auto p-0",
          isMobile ? "sm:w-[300px]" : "sm:w-[400px]",
        )}
      >
        <div className="border-border bg-background sticky top-0 z-10 border-b">
          <div className="flex items-center justify-center px-6 py-4">
            <h2 className="text-lg font-semibold">Session History</h2>
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <div className="py-4">
              <DotFlashing />
            </div>
          ) : histories && histories.length ? (
            histories.map((history) => (
              <div
                key={history._id}
                onClick={() => {
                  setSessionHistoryId(history._id);
                  setOpen(false);
                }}
                className="border-border hover:bg-accent flex cursor-pointer items-center gap-2 border-b py-4 transition-colors"
              >
                <ListTodo className="text-primary size-4" />
                <p className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {history.messages[0].content.message}
                </p>
              </div>
            ))
          ) : (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center gap-2">
              <FileText className="text-muted-foreground size-4" />
              <p className="text-muted-foreground">No history found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionHistoryModal;
