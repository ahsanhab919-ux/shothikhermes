import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGetUsesLimitQuery } from "@/redux/api/tools/toolsApi";
import Link from "next/link";
import { useEffect } from "react";

function formatNumber(number) {
  if (!number) return 0;
  const length = number.toString().length;
  if (length >= 4) {
    return number.toLocaleString("en-US");
  }
  return number.toString();
}

const Navigations = ({
  isMobile,
  loadingAi,
  hasOutput,
  handleAiDitectors,
  miniLabel,
  handleSubmit,
  isLoading,
  model,
  wordCount,
  wordLimit,
  userInput,
  userPackage,
  update,
}) => {
  const { data: userLimit, refetch } = useGetUsesLimitQuery({
    service: "bypass",
    model: model.toLowerCase(),
  });

  useEffect(() => {
    refetch();
  }, [update, refetch]);

  const progressPercentage = () => {
    if (!userLimit) return 0;

    const totalWords = userLimit.totalWordLimit;
    const remainingWords = userLimit.remainingWord;
    const progress = (remainingWords / totalWords) * 100;
    return progress;
  };

  return (
    <div className="my-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="ml-1 flex flex-row items-center gap-2 md:ml-0">
        <Button
          onClick={handleSubmit}
          aria-label="Humanize text"
          disabled={
            !userInput ||
            wordCount > wordLimit
          }
          className="h-10 px-4"
        >
          {isLoading ? (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <SvgColor src="/navbar/humanize.svg" className="mr-2 h-5 w-5" />
          )}
          {!hasOutput ? "Humanize" : "Re humanize"}
        </Button>

        {wordCount > wordLimit && (
          <Link href="/pricing">
            <Button className="h-10">
              <SvgColor src="/navbar/diamond.svg" className="mr-2 h-5 w-5" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      {userLimit && (
        <div className="w-[235px] pl-2 sm:pl-0">
          {userLimit?.totalWordLimit === 99999 ? (
            <>
              <Progress value={100} className="h-2" />
              <p className="text-primary text-sm">Unlimited</p>
            </>
          ) : (
            <>
              <Progress value={progressPercentage()} className="h-2" />
              <p className="text-sm">
                {formatNumber(userLimit?.totalWordLimit)} words /{" "}
                {formatNumber(userLimit?.remainingWord)} words left
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Navigations;
