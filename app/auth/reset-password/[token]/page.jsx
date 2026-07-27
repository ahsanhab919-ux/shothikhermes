import AuthForgotPasswordForm from "@/components/auth/AuthForgotPasswordForm";
import ReturnToHome from "@/components/auth/components/ReturnToHome";
import PasswordIcon from "@/components/icons/PasswordIcon";
import Logo from "@/components/partials/logo";

// ----------------------------------------------------------------------
export async function generateMetadata() {
  return {
    title: "Reset Password || Shothik AI",
    description: "Reset Password page",
  };
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-muted flex min-h-screen flex-col">
      <header className="bg-background h-[50px] px-4 py-1 sm:h-20 sm:px-12 sm:py-3">
        <Logo />
      </header>
      <div className="flex h-[calc(100vh-50px)] items-center justify-center sm:h-[calc(100vh-80px)]">
        <div className="bg-background w-full rounded-2xl p-4 text-center shadow-lg sm:w-[500px] sm:p-8">
          <PasswordIcon className="mb-12 h-24" />
          <h1 className="mb-3 text-4xl font-semibold">Reset your password</h1>

          <p className="text-muted-foreground mb-12">
            Please enter the password
          </p>

          <AuthForgotPasswordForm />

          <ReturnToHome />
        </div>
      </div>
    </div>
  );
}
