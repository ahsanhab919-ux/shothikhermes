import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { setShowForgotPasswordModal } from "@/redux/slices/auth";
import { ChevronLeft } from "lucide-react";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import AuthResetPasswordForm from "./AuthResetPasswordForm";
import PasswordIcon from "@/components/icons/PasswordIcon";

export default function ForgetPasswordModal() {
  const dispatch = useDispatch();
  const { showForgotPasswordModal } = useSelector((state) => state.auth);

  const handleClose = () => {
    dispatch(setShowForgotPasswordModal(false));
  };

  return (
    <>
      <Head>
        <title>Reset Password | Shothik AI</title>
      </Head>

      <Dialog open={showForgotPasswordModal} onOpenChange={handleClose}>
        <DialogContent className="w-[90%] rounded-lg p-8 sm:w-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <PasswordIcon className="mb-4 h-24" />

            <h2
              id="forgot-password-title"
              className="mb-2 text-center text-2xl font-semibold"
            >
              Forgot your password?
            </h2>

            <p className="text-muted-foreground text-center">
              Please enter the email address associated with your account, and
              we will email you a link to reset your password.
            </p>

            <AuthResetPasswordForm />

            <Button
              variant="link"
              onClick={handleClose}
              className="mx-auto mt-6 inline-flex cursor-pointer items-center"
            >
              <ChevronLeft className="h-4 w-4" />
              Return to sign in
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
