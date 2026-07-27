"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useSendVerifyEmailMutation } from "@/redux/api/auth/authApi";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const VerifyEmailAlert = () => {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const showVerifyModal = !user?.is_verified;

  const resendEmail = router.pathname === "/auth/resend-email";
  const email = resendEmail ? router.query?.email : user?.email;
  const message = sent
    ? `A verification email has been sent to ${email}. Please check your inbox.`
    : "Your account is not verified yet. Verify your mail to write with confidence.";
  const action = sent ? "Resend" : "Verify";

  const [sendVerificationEmail, { isLoading }] = useSendVerifyEmailMutation();

  const handleVerify = async () => {
    try {
      const result = await sendVerificationEmail({ email: user?.email });
      if (result.data.success) {
        setSent(true);
        toast.success("Sent a verification email to " + user.email + ".");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sorry, something went wrong. Please try again.");
    }
  };

  if (!email || !showVerifyModal) return null;

  return (
    <div className="relative mb-4 px-4 sm:px-0">
      <Alert variant="default" className="border-amber-500 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span className="flex-1 whitespace-normal">{message}</span>
          <Button
            variant="default"
            size="sm"
            disabled={isLoading}
            onClick={handleVerify}
            className="shrink-0 bg-amber-500 hover:bg-amber-600"
          >
            {isLoading ? "Sending..." : action}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerifyEmailAlert;
