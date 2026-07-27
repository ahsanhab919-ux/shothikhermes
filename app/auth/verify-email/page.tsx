"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";

export default function VerifyEmailCodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginHref = useMemo(
    () => `/auth/login?email=${encodeURIComponent(email.trim())}`,
    [email],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(normalizedEmail)) {
      setError("Enter the same email address you used during registration.");
      return;
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError("Enter the 6-digit verification code from your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: normalizedOtp,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Unable to verify email.");
      }

      setSuccess("Email verified. Redirecting you to sign in...");
      window.setTimeout(() => {
        router.replace(`/auth/login?email=${encodeURIComponent(normalizedEmail)}&verified=1`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify email.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
          <MailCheck className="h-3.5 w-3.5 text-brand" />
          Email verification
        </div>

        <h1 className="mt-6 text-3xl font-bold text-foreground">Enter your verification code</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Insforge sent a 6-digit code to your inbox. Enter it here to activate your account and finish sign-in.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="123456"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify email"}
            {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {success ? (
          <p role="status" className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            {success}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-4 text-sm">
          <Link href={loginHref} className="text-primary hover:underline">
            Back to sign in
          </Link>
          <Link href="/auth/register" className="text-muted-foreground hover:text-foreground">
            Create another account
          </Link>
        </div>
      </div>
    </div>
  );
}
