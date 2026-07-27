"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { setIsNewRegistered } from "@/redux/slices/auth";
import { Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

export default function AuthSuccessPopup() {
  const { isNewRegistered } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return (
    <Dialog
      open={isNewRegistered}
      onOpenChange={() => dispatch(setIsNewRegistered(false))}
    >
      <DialogContent className="m-2 max-w-[400px] rounded-2xl p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="mb-2 flex items-center justify-center rounded-full bg-green-500 p-4">
            <Check className="h-12 w-12 text-white" />
          </div>

          <h2 className="text-2xl font-medium tracking-wide text-green-500 uppercase">
            Success
          </h2>

          <p className="text-muted-foreground mb-4 text-base">
            Congratulations, your account has been successfully created.
          </p>

          <Button
            onClick={() => dispatch(setIsNewRegistered(false))}
            className="rounded-full bg-green-500 px-8 py-3 text-base normal-case hover:bg-green-600"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
