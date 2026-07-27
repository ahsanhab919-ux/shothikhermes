import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function GoogleLoginButton({ loading, setLoading, title, onAuthSuccess }) {
  const [error, setError] = useState("");

  const onGoogleLogin = async () => {
    if (typeof window === "undefined") {
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (onAuthSuccess) {
        onAuthSuccess();
      }

      const nextPath = encodeURIComponent("/auth/post-login");
      window.location.assign(`/api/auth/oauth/google?next=${nextPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start Google sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <Button
        type="button"
        variant="outline"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg"
        onClick={onGoogleLogin}
        disabled={loading}
      >
        <div className="mt-1">
          {loading ? (
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          ) : (
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
        </div>
        <span className="text-muted-foreground text-base font-semibold">
          Sign {title} with Google
        </span>
      </Button>
      {error ? (
        <p role="alert" className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AuthWithSocial({ loading, setLoading, title = "in", onAuthSuccess }) {
  return (
    <div className="flex justify-center">
      <GoogleLoginButton
        loading={loading}
        setLoading={setLoading}
        title={title}
        onAuthSuccess={onAuthSuccess}
      />
    </div>
  );
}
