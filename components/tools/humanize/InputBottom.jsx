import { Button } from "@/components/ui/button";
import useWordLimit from "@/hooks/useWordLimit";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const InputBottom = ({
  userInput,
  isMobile,
  miniLabel,
  isLoading,
  handleClear,
  setWordCount,
}) => {
  const { wordLimit } = useWordLimit("bypass");
  const [userInputInfo, setUserInputInfo] = useState({
    charecters: 0,
    sentences: 0,
    words: 0,
  });
  useEffect(() => {
    if (!userInput) return;

    const words = userInput.trim() ? String(userInput).split(" ").length : 0;
    const charecters = userInput.length;
    const sentences = userInput.split(/[.!?]/).filter(Boolean).length;
    setUserInputInfo({ words, charecters, sentences });
    setWordCount(words);
  }, [userInput]);

  return (
    <div className="border-border flex items-center justify-between border-t px-2">
      <div className="flex items-center gap-2">
        <span
          className={`text-sm sm:text-base md:text-base ${userInputInfo.words > wordLimit ? "text-destructive" : ""}`}
        >
          {userInputInfo.words} /{" "}
          {wordLimit === 9999 ? (
            <span className="text-primary">Unlimited</span>
          ) : (
            wordLimit
          )}{" "}
          Words
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm sm:text-base md:text-base">
          {userInputInfo.charecters} {isMobile ? "Char" : "Characters"}
        </span>
        <span className="text-muted-foreground">|</span>
        <span className="text-sm sm:text-base md:text-base">
          {userInputInfo.sentences} {isMobile ? "Sen" : "Sentences"}
        </span>
      </div>
      <Button
        variant="ghost"
        size={isMobile ? "sm" : "default"}
        className="h-9"
        disabled={isLoading}
        onClick={handleClear}
      >
        <Trash2 className="text-muted-foreground h-4 w-4" />
      </Button>
    </div>
  );
};

export default InputBottom;
