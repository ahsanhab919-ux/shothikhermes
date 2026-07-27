import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { Copy, Download } from "lucide-react";
import WordCounter from "../common/WordCounter";
import { downloadFile } from "../common/downloadfile";

const BottomBar = ({
  userInput,
  outputContend,
  userPackage,
  isHumanizing,
  isLoading,
  handleClear,
  handleHumanize,
  handleSubmit,
}) => {
  const isMobile = useResponsive("down", "sm");

  async function handleCopy() {
    await navigator.clipboard.writeText(outputContend);
    toast.success("Copied to clipboard");
  }

  const handleDownload = async () => {
    await downloadFile(outputContend, "translation");
    toast.success("Text Downloaded");
  };

  return (
    <WordCounter
      toolName="translator"
      userInput={userInput}
      userPackage={userPackage}
      isLoading={isLoading}
      handleClearInput={handleClear}
      handleSubmit={handleSubmit}
      btnText={outputContend ? "Regenerate" : "Translate"}
      sticky={320}
      // ExtraBtn={
      //   outputContend ? (
      //     <Button
      //       onClick={handleHumanize}
      //       variant='contained'
      //       disabled={isLoading}
      //       loading={isHumanizing}
      //       sx={{ py: { md: 0 }, px: { md: 2 }, height: { md: 40 } }}
      //     >
      //       Humanize
      //     </Button>
      //   ) : null
      // }
    >
      {/* <div className="flex flex-row items-center">
        {outputContend && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleDownload}
                  aria-label="download"
                  variant="ghost"
                  size={isMobile ? "icon-sm" : "icon"}
                  className="rounded-[5px]"
                >
                  <Download
                    className={cn(
                      "font-semibold",
                      isMobile ? "size-4" : "size-5",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Export</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCopy}
                  aria-label="copy"
                  variant="ghost"
                  size={isMobile ? "icon-sm" : "icon"}
                  className="rounded-[5px]"
                >
                  <Copy className={cn(isMobile ? "size-4" : "size-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copy Full Text</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div> */}
    </WordCounter>
  );
};

export default BottomBar;
