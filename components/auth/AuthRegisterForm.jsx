"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

import { trackEvent } from "@/analysers/eventTracker";
import { useRegisterMutation } from "@/redux/api/auth/authApi";
import {
  setIsNewRegistered,
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

// Common password list
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

// Validation schema
const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(20, "First name must not exceed 20 characters")
    .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(20, "Last name must not exceed 20 characters")
    .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
  email: z.string().email("Email must be a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must not exceed 20 characters")
    .refine((val) => !commonPasswords.includes(val), {
      message: "This password is too common. Please choose a stronger one.",
    }),
});

export default function AuthRegisterForm({ country, loading }) {
  const [registerUser, { isLoading, isError, error }] = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = form.watch("password");
  const passwordLengthValid = passwordValue?.length >= 8;

  const onSubmit = async (data) => {
    try {
      trackEvent("click", "auth", "sign-up-button", 1);

      const payload = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        auth_type: "manual",
        password: data.password,
        country,
      };

      const res = await registerUser(payload);
      if (res?.data) {
        dispatch(setShowRegisterModal(false));
        dispatch(setShowLoginModal(false));
        dispatch(setIsNewRegistered(true));
      }
    } catch (err) {
      form.reset();
      form.setError("root", {
        message: err?.message || "An error occurred while creating account",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Submit error (from API or form) */}
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>{error?.data?.message}</AlertDescription>
          </Alert>
        )}
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {/* First name */}
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last name */}
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
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

        {/* Password */}
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

        {/* Password rule check */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {passwordLengthValid ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="text-muted-foreground h-5 w-5" />
            )}
            <span className="text-muted-foreground text-sm">
              Must be at least 8 characters
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="mt-2 w-full"
          size="lg"
          disabled={isLoading || loading}
        >
          {isLoading || loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
