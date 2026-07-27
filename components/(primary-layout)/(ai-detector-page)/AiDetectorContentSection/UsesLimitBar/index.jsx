import { cn } from "@/lib/utils";

function formatNumber(number) {
  if (!number) return 0;
  const length = number.toString().length;
  return length >= 4 ? number.toLocaleString("en-US") : number.toString();
}

const UsesLimitBar = ({ className, text, min, limit }) => {
  const progressPercentage = () => {
    if (!limit) return 0;
    const totalWords = limit.totalWordLimit;
    const remainingWords = limit.remainingWord;
    return (remainingWords / totalWords) * 100;
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-4 py-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 text-sm">
        <span>
          <span>{formatNumber(text?.length || 0)}</span>/<span>{min}</span>
        </span>
        <span className="whitespace-nowrap">characters min</span>
      </div>
      <div className="w-full max-w-64 space-y-1">
        <div className="bg-muted/50 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-500"
            style={{ width: `${progressPercentage()}%` }}
          ></div>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          {formatNumber(limit?.remainingWord)} credits of{" "}
          {formatNumber(limit?.totalWordLimit)} remaining
        </p>
      </div>
    </div>
  );
};

export default UsesLimitBar;
