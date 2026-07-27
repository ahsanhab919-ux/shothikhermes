"use client";
import FormProvider from "@/components/common/FormProvider";
import RHFTextField from "@/components/common/RHFTextField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useResetPasswordMutation } from "@/redux/api/auth/authApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

// ----------------------------------------------------------------------
const commonPasswords = [
  "password",
  "123456",
  "12345678",
  "admin",
  "welcome",
  "qwerty",
  "letmein",
  "football",
  "iloveyou",
  "abc123",
  "monkey",
  "123123",
  "sunshine",
  "princess",
  "dragon",
];

export default function AuthForgotPasswordForm() {
  const { push } = useRouter();
  const { token } = useParams();
  const [resetPassword, { isLoading, isError, error }] =
    useResetPasswordMutation();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const ResetSchema = z.object({
    password: z.string()
      .min(8, "Password must be at least 8 characters long")
      .max(20, "Password must not exceed 20 characters")
      .refine(
        (val) => !commonPasswords.includes(val),
        "This password is too common. Please choose a stronger one."
      ),
  });

  const defaultValues = {
    key: "",
    email: "",
    password: "",
  };

  const methods = useForm({
    resolver: zodResolver(ResetSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { errors },
    watch,
  } = methods;

  const password = watch().password;

  const onSubmit = async (data) => {
    let payload = {
      key: token,
      password: data.password,
    };

    try {
      const result = await resetPassword(payload);
      if (result.data) {
        toast.success("Update success! Please login");
        push("/");
        dispatch(setShowLoginModal(true));
      }
    } catch (error) {
      console.error(error);

      reset();

      setError("afterSubmit", {
        ...error,
        message: error.message || error,
      });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        {!!errors.afterSubmit && (
          <Alert variant="destructive">
            <AlertDescription>{errors.afterSubmit.message}</AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{error?.data?.message}</AlertDescription>
          </Alert>
        )}

        <RHFTextField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          endAdornment={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="h-8 w-8"
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          }
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {password.length >= 8 ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="text-muted-foreground h-5 w-5" />
            )}
            <span className="text-muted-foreground text-sm">
              Must be at least 8 characters
            </span>
          </div>
        </div>

        <Button
          type="submit"
          className="from-primary to-primary/80 h-11 w-full bg-gradient-to-r"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </FormProvider>
  );
}
