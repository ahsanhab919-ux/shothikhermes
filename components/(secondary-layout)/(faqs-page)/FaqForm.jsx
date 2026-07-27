"use client";
import FormProvider from "@/components/common/FormProvider";
import RHFTextField from "@/components/common/RHFTextField";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useContactMutation } from "@/redux/api/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function FaqForm() {
  const [contact] = useContactMutation();

  const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string()
      .min(1, "Email is required")
      .email("Enter a valid email"),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
  });

  const defaultValues = {
    name: "",
    email: "",
    subject: "",
    message: "",
  };

  const methods = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data) => {
    try {
      await contact(data).unwrap();
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
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3">
        <h4 className="from-primary to-primary/70 bg-gradient-to-br bg-clip-text text-2xl font-bold text-transparent">
          Haven&apos;t found the right help?
        </h4>

        <RHFTextField label="Your name" name="name" />
        <RHFTextField label="Your e-mail address" name="email" />
        <RHFTextField label="Subject" name="subject" />
        <RHFTextField
          label="Enter your message here."
          name="message"
          placeholder="Enter your message here."
        />
        <Button
          type="submit"
          size="lg"
          variant="default"
          disabled={isSubmitting}
        >
          Submit Now
        </Button>
      </div>
    </FormProvider>
  );
}
