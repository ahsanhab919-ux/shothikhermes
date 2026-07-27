"use client";
import RHFTextField from "@/components/common/RHFTextField";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useAffiliateMutation } from "@/redux/api/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

export default function WaitlistForm({ userType }) {
  const [affiliate] = useAffiliateMutation();

  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
  });

  const defaultValues = {
    name: "",
    email: "",
  };

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data) => {
    try {
      // Backend only expects name and email
      const payload = {
        name: data.name,
        email: data.email,
      };

      await affiliate(payload).unwrap();

      toast.success(`Submitted successfully!`);
      reset();
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Sorry, an unexpected error occurred.";
      toast.error(errorMessage);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
        <div className="w-full space-y-4">
          <RHFTextField
            name="name"
            placeholder="Full Name"
            startAdornment={
              <div className="flex items-center justify-center">
                <User className="text-muted-foreground h-5 w-5" />
              </div>
            }
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            className="w-full"
            inputProps={{
              className: "!bg-white dark:!bg-background !border-gray-300 dark:!border-border !text-gray-900 dark:!text-foreground placeholder:!text-gray-400 dark:placeholder:!text-muted-foreground h-12 !pl-[56px]"
            }}
          />
          <RHFTextField
            name="email"
            placeholder="Email"
            startAdornment={
              <div className="flex items-center justify-center">
                <Mail className="text-muted-foreground h-5 w-5" />
              </div>
            }
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            className="w-full"
            inputProps={{
              className: "!bg-white dark:!bg-background !border-gray-300 dark:!border-border !text-gray-900 dark:!text-foreground placeholder:!text-gray-400 dark:placeholder:!text-muted-foreground h-12 !pl-[56px]"
            }}
          />
          <Button
            // data-umami-event="Form: Join the waitlist"
            data-rybbit-event="Form: Join the waitlist"
            variant="default"
            size="lg"
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold"
          >
            Join The Waitlist
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
