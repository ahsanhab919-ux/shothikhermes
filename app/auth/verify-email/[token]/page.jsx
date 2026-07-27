"use client";

import { useVerifyEmailMutation } from "@/redux/api/auth/authApi";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();
  const [verifyEmail, { isLoading, isSuccess, isError, error }] =
    useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      verifyEmail({ key: token });
    }
  }, [token, verifyEmail]);

  useEffect(() => {
    if (isSuccess) {
      // 
      toast.success("Email verification successful!");
      setTimeout(() => {
        router.push("/");
      }, 0);
    }

    if (isError) {
      // console.error("Email verification failed:", error);
      if (error?.data?.message === "Invalid or expired token") {
        toast.error("Token expired. Please request a new verification email.");
      } else {
        toast.error("Email verification failed. Please try again.");
      }
      setTimeout(() => {
        router.push("/");
      }, 2500);
    }
  }, [isSuccess, isError, error, router]);

  return null;
}
