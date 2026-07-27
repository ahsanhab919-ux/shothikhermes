"use client";

import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import ButtonPasteText from "@/components/buttons/ButtonPasteText";
import ButtonSampleText from "@/components/buttons/ButtonSampleText";
import { cn } from "@/lib/utils";

const InitialInputActions = ({
  input = "",
  setInput,
  sample,
  showSample = false,
  showPaste = false,
  showInsertDocument = false,
  className,
}) => {
  const buttons = [];

  if (showSample) {
    buttons.push(
      <ButtonSampleText
        key="sample"
        sample={sample}
        onApply={(value) => setInput(value)}
      />,
    );
  }

  if (showPaste) {
    buttons.push(
      <ButtonPasteText key="paste" onApply={(value) => setInput(value)} />,
    );
  }

  if (showInsertDocument) {
    buttons.push(
      <ButtonInsertDocumentText
        key="insert-document"
        onApply={(value) => setInput(value)}
      />,
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {buttons.map((button, index) => (
        <div key={index} className="flex items-center gap-2">
          {button}
          {index < buttons.length - 1 && <span>Or</span>}
        </div>
      ))}
    </div>
  );
};

export default InitialInputActions;
