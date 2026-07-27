"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

import { trackEvent } from "@/analysers/eventTracker";
import { useLoginMutation } from "@/redux/api/auth/authApi";
import {
  logout,
  setShowForgotPasswordModal,
  setShowLoginModal,
  setShowRegisterModal,
} from "@/redux/slices/auth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// ----------------------------------------------------------------------

const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Email must be a valid email address"),
  password: z.string().nonempty("Password is required"),
});

export default function AuthLoginForm({ loading, setLoading }) {
  const [login, { isLoading, error, isError }] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogout = async () => {
    try {
      dispatch(logout());
      localStorage.setItem("logout-event", Date.now().toString());
    } catch (error) {
      console.error("🚀 ~ handleLogout ~ error:", error);
    }
  };

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "logout-event") {
        dispatch(logout());
        router.replace("/");
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [dispatch, router]);

  const onSubmit = async (data) => {
    try {
      handleLogout();
      trackEvent("click", "auth", "login-button", 1);

      const payload = {
        email: data.email,
        auth_type: "manual",
        password: data.password,
      };

      const res = await login(payload);
      if (res?.data) {
        dispatch(setShowRegisterModal(false));
        dispatch(setShowLoginModal(false));
      }
    } catch (error) {
      form.reset();
      form.setError("root", {
        message: error?.message || "An error occurred during login",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{error?.data?.message}</AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            onClick={() => dispatch(setShowForgotPasswordModal(true))}
            className="px-0 font-semibold"
          >
            Forgot password?
          </Button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || isLoading}
        >
          {loading || isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}
