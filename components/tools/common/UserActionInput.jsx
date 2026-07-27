"use client";
import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClipboardPaste, FileText } from "lucide-react";
import dynamic from "next/dynamic";

const FileUpload = dynamic(() => import("./FileUpload"), {
  ssr: false,
});

const UserActionInput = ({
  isMobile,
  setUserInput,
  extraAction,
  disableTrySample = false,
  sampleText,
}) => {
  async function handlePaste() {
    const clipboardText = await navigator.clipboard.readText();
    setUserInput(clipboardText);
    if (extraAction) extraAction();
  }

  function handleSampleText() {
    if (!sampleText) return;
    setUserInput(sampleText);
    if (extraAction) extraAction();
  }

  const handleFileData = (htmlValue) => {
    setUserInput(htmlValue);
    if (extraAction) extraAction();
  };

  return (
    <div className={cn("flex flex-col items-center gap-2")}>
      <div
        id="sample-paste-section"
        className={cn("flex flex-wrap items-center justify-center", "gap-2")}
      >
        {!disableTrySample ? (
          <>
            <Button
              type="button"
              onClick={handleSampleText}
              disabled={!sampleText}
              variant="outline"
              size="sm"
              className={cn("shrink-0 whitespace-nowrap")}
            >
              <FileText className="size-4" />
              Try Sample
            </Button>
            <span className="text-muted-foreground text-sm">Or</span>
          </>
        ) : null}
        <Button
          type="button"
          onClick={handlePaste}
          variant="outline"
          size="sm"
          className={cn("shrink-0 whitespace-nowrap")}
        >
          <ClipboardPaste className="size-4" />
          Paste Text
        </Button>
      </div>
      <div className="mt-1">
        <ButtonInsertDocumentText
          key="insert-document"
          onApply={(value) => {
            setUserInput(value);
            if (extraAction) extraAction();
          }}
        />
        {/* <div id="upload_button">
          {FileUpload && (
            <FileUpload isMobile={isMobile} setInput={handleFileData} />
          )}
          <p className={cn("text-muted-foreground text-center text-xs")}>
            {isMobile ? "" : "Supported file"} formats: pdf,docx.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default UserActionInput;
