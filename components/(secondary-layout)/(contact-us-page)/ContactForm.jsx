"use client";
import FormProvider from "@/components/common/FormProvider";
import RHFTextField from "@/components/common/RHFTextField";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useContactMutation } from "@/redux/api/auth/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function ContactForm() {
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
      <div className="flex flex-col gap-5">
        <motion.h3
          initial={{ y: -20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-3xl font-bold"
        >
          Feel free to contact us. We&apos;ll be glad to hear from you, buddy.
        </motion.h3>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex flex-col gap-3"
        >
          <RHFTextField label="Your name" name="name" />
          <RHFTextField label="Your e-mail address" name="email" />
          <RHFTextField label="Subject" name="subject" />

          <RHFTextField
            label="Enter your message here."
            name="message"
            placeholder="Enter your message here."
          />
        </motion.div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Button
            type="submit"
            size="lg"
            variant="default"
            disabled={isSubmitting}
          >
            Submit Now
          </Button>
        </motion.div>
      </div>
    </FormProvider>
  );
}
