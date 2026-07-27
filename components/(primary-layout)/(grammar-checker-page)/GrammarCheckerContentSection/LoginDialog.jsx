"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setShowLoginModal } from "@/redux/slices/auth";
import { useDispatch } from "react-redux";

const LoginDialog = ({ loginDialogOpen, setLoginDialogOpen }) => {
  const dispatch = useDispatch();
  return (
    <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to check grammar. Please log in to
            continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              dispatch(setShowLoginModal(true));
              setLoginDialogOpen(false);
            }}
          >
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
