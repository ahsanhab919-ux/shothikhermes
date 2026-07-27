import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MobileFreezeModal = ({
  isFreeze,
  handleClose,
  userPackage,
  initialFrozenWords,
  frozenWords,
}) => {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    frozenWords.toggle(value);
    setValue("");
  }

  function handleDelete(word) {
    frozenWords.remove(word);
  }

  const needToUpgrade = !userPackage || userPackage === "free";

  return (
    <Drawer
      open={isFreeze}
      onOpenChange={(open) => !open && handleClose()}
      direction="right"
    >
      <DrawerContent
        className="w-[65%]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DrawerHeader className="border-border flex flex-row items-center justify-between border-b p-2">
          <DrawerTitle className="text-2xl font-semibold">
            Freeze Words
          </DrawerTitle>

          <button
            onClick={handleClose}
            className="hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex items-center justify-center rounded-md p-2 transition-colors outline-none focus-visible:ring-2"
          >
            <X className="size-5" />
          </button>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="mt-7.5 mb-5 px-2.5">
          <div className="space-y-2">
            <label className="text-sm leading-none font-medium">
              Enter the word to freeze...
            </label>
            <Textarea
              name="input"
              rows={3}
              className="w-full resize-none"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <Button
            className="mt-2 w-full"
            type={needToUpgrade ? "button" : "submit"}
            onClick={(e) => {
              if (needToUpgrade) {
                router.push("/pricing?redirect=paraphrase");
              }
            }}
          >
            {needToUpgrade ? "Upgrade" : "Freeze"}
          </Button>
        </form>

        {frozenWords.size > 0 && (
          <div className="flex w-full flex-wrap gap-1 px-2 sm:gap-2">
            <Badge
              variant="destructive"
              className="group cursor-pointer gap-2 font-bold"
              onClick={() => frozenWords.reset(initialFrozenWords)}
            >
              <span>Clear All</span>
              <X className="size-3 cursor-pointer group-hover:opacity-70" />
            </Badge>

            {frozenWords.values.map((item, index) => (
              <Badge key={index} variant="outline" className="group gap-2">
                <span>{item}</span>
                <button
                  onClick={(e) => handleDelete(item)}
                  className="focus-visible:ring-ring hover:bg-accent inline-flex items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFreezeModal;
