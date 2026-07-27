"use client";
import FormProvider from "@/components/common/FormProvider";
import RHFTextField from "@/components/common/RHFTextField";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useForgotPasswordMutation } from "@/redux/api/auth/authApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

// ----------------------------------------------------------------------

export default function AuthResetPasswordForm() {
  const [forgotPassword] = useForgotPasswordMutation();
  const [isSentMail, setIsSentMail] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const dispatch = useDispatch();

  const ForgotSchema = z.object({
    email: z.string()
      .min(1, "Email is required")
      .email("Email must be a valid email address"),
  });

  const defaultValues = {
    email: "",
  };

  const methods = useForm({
    resolver: zodResolver(ForgotSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data) => {
    let payload = {
      email: data.email,
    };

    try {
      const result = await forgotPassword(payload);

      if (result?.data?.success) {
        dispatch(setShowLoginModal(false));
        toast.success(
          "Reset password link sent to your email. Please check.",
        );
      }

      if (result?.error) {
        setErrorMessage(result?.error?.data?.message);
        toast.error(result?.error?.data?.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      reset();

      setError("afterSubmit", {
        ...error,
        message: error.message || error,
      });
    } finally {
      setIsSentMail(true);
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <RHFTextField name="email" label="Email address" />
        {errorMessage && (
          <p className="text-destructive min-h-[1.5em] text-sm">
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          className="mt-6 w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Sending..."
            : `${isSentMail ? "Resend" : "Send"} Request`}
        </Button>
      </div>
    </FormProvider>
  );
}
