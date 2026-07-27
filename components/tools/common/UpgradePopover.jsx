"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Gem } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UpgradePopover({
  anchorEl,
  onClose,
  redirectPath = "/pricing?redirect=/humanize-gpt",
  message = "Unlock advanced features and enhance your humanize experience.",
}) {
  const router = useRouter();
  const open = Boolean(anchorEl);

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <DialogContent className={cn("w-[300px] p-4 sm:max-w-[360px]")}>
        <DialogHeader>
          <DialogTitle className="text-center text-base font-medium">
            Upgrade Required
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground mt-1 mb-3 text-center text-sm">
          {message}
        </p>
        <div className="flex justify-center">
          <Button
            size="sm"
            onClick={() => {
              router.push(redirectPath);
              onClose();
            }}
          >
            <Gem className="mr-2 h-4 w-4" /> Upgrade To Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
