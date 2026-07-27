"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { Lock, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

export default function AlertDialog() {
  const { showAlert, alertMessage } = useSelector((state) => state.tools);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <Dialog open={showAlert} onOpenChange={() => dispatch(setShowAlert(false))}>
      <DialogContent className="max-w-xs">
        <div className="-mb-7 flex items-center justify-end">
          <div className="pt-5 pr-5">
            <button
              onClick={() => dispatch(setShowAlert(false))}
              className="cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="pt-3 md:pt-5">
          <Lock className="text-primary mx-auto h-24 w-24" />
        </div>
        <DialogDescription className="pt-3 text-center md:pt-3">
          {alertMessage}
        </DialogDescription>
        <DialogFooter className="mb-1.5 md:mb-2.5">
          {alertMessage !== "You can't use less than 30 words" && (
            <>
              {!user ? (
                <Button
                  className="bg-foreground text-background hover:bg-foreground/90 w-full"
                  variant="default"
                  size="default"
                  onClick={() => {
                    dispatch(setShowAlert(false));
                    dispatch(setShowLoginModal(true));
                  }}
                >
                  Login
                </Button>
              ) : !/value_plan|pro_plan|unlimited/.test(user?.package) ? (
                <Button
                  className="bg-foreground text-background hover:bg-foreground/90 w-full"
                  variant="default"
                  size="default"
                  onClick={() => {
                    dispatch(setShowAlert(false));
                    router.push("/pricing");
                  }}
                >
                  Upgrade now
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
