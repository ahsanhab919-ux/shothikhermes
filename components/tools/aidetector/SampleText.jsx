import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

const gptModel = [
  {
    name: "Chat GPT",
    icon: "/tools/chatgpt.svg",
    text: "chatgpt",
  },
  {
    name: "Claude",
    icon: "/tools/claude.svg",
    text: "claude",
  },
  {
    name: "Llama",
    icon: "/tools/llama.svg",
    text: "llama",
  },
  {
    name: "Human",
    icon: "/tools/human.svg",
    text: "human",
  },
];

function SampleTextForMobile({ setOpen, isMini }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    function handleScroll() {
      const height = window.innerHeight;
      const scrollHeight = window.scrollY;
      if (scrollHeight + height - 100 > height) setShow(false);
      else setShow(true);
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!show) return null;
  return (
    <div
      className={cn(
        "fixed right-5 bottom-2 z-[100]",
        isMini ? "sm:left-[105px]" : "sm:left-[290px]",
      )}
    >
      <Card
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1 rounded-full px-3 py-2"
      >
        <Image src="/tools/sample.svg" alt="sample" width={24} height={24} />
        <span>Sample Text</span>
      </Card>
    </div>
  );
}

const SampleTextForLarge = ({
  isDrawer = false,
  setOpen,
  handleSampleText,
}) => {
  const handleClick = (text) => {
    handleSampleText(text);
    if (isDrawer) {
      setOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "relative flex h-full justify-center px-3",
        isDrawer ? "py-3" : "py-0",
      )}
    >
      {isDrawer && (
        <button
          className="hover:bg-accent absolute top-2 right-2 z-50 rounded-xs transition-colors"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </button>
      )}

      <div className={cn(isDrawer ? "ml-0" : "ml-4")}>
        <Card
          className={cn(
            "border",
            isDrawer ? "w-full shadow-none" : "w-[250px]",
          )}
        >
          <div className="flex flex-col gap-0.5 py-1">
            {gptModel.map((item, index) => (
              <Button
                variant="ghost"
                key={index}
                className="flex items-center justify-start gap-2 bg-transparent py-1 hover:bg-transparent"
                onClick={() => handleClick(item.text)}
              >
                <Image src={item.icon} alt={item.name} width={24} height={24} />
                <span className="text-sm">{item.name}</span>
              </Button>
            ))}
          </div>
        </Card>
        <div
          className={cn(
            "flex flex-col",
            isDrawer ? "items-center" : "items-start",
          )}
        >
          <div
            className={cn(
              "mt-3 flex items-center gap-0.5",
              isDrawer ? "justify-center" : "justify-start",
            )}
          >
            <Image
              src="/tools/language.svg"
              alt="language"
              width={100}
              height={100}
              className="max-w-4!"
            />
            <span className="font-semibold">Supported languages:</span>
          </div>
          <span className="mt-0.5 mb-1">
            English, Bangla, Hindi and 100+ more
          </span>
          {/* <span className="text-[15px] border-b border-border w-fit cursor-pointer text-muted-foreground">
            Request more languages
          </span> */}
        </div>
      </div>
    </div>
  );
};

function SampleText({
  isMobile,
  isDrawer = false,
  setOpen,
  handleSampleText,
  isMini,
}) {
  if (isMobile)
    return (
      <>
        <Dialog open={isDrawer} onOpenChange={setOpen}>
          <DialogContent className="w-full max-w-xs p-0">
            <SampleTextForLarge
              isDrawer={true}
              setOpen={setOpen}
              handleSampleText={handleSampleText}
            />
          </DialogContent>
        </Dialog>
        <SampleTextForMobile setOpen={setOpen} isMini={isMini} />
      </>
    );
  else
    return (
      <SampleTextForLarge
        handleSampleText={handleSampleText}
        setOpen={setOpen}
        isDrawer={isDrawer}
      />
    );
}

export default SampleText;
