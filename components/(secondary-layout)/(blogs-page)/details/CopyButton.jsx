"use client";

import { Button } from "@/components/ui/button";
import useSnackbar from "@/hooks/useSnackbar";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const CopyButton = ({ text }) => {
  const enqueueSnackbar = useSnackbar();
  const [showCopy, setShowCopy] = useState(true);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    enqueueSnackbar("Copied URL");
    setShowCopy(false);
    setTimeout(() => {
      setShowCopy(true);
    }, 2000);
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy}>
      {showCopy ? <Copy className="size-5" /> : <Check className="size-5" />}
    </Button>
  );
};

export default CopyButton;
