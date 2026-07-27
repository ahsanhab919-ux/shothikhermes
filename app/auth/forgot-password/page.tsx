"use client";

import AuthResetPasswordForm from "@/components/auth/AuthResetPasswordForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background">
      <div className="bg-card p-8 rounded shadow-md w-full max-w-md border border-border">
        <div className="flex flex-col items-center space-y-4 mb-6">
          <h2 className="text-2xl font-bold text-center text-foreground">Reset Password</h2>
          <p className="text-sm text-muted-foreground text-center">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <AuthResetPasswordForm />

        <div className="mt-6 flex justify-center">
          <Link
            href="/auth/login"
            className="text-primary text-sm hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
