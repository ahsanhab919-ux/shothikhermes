"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useComponentTracking } from "@/hooks/useComponentTracking";
import { trackingList } from "@/lib/trackingList";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

export default function EmailModal({ open, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { componentRef, trackClick, trackFormInteraction, trackConversion } =
    useComponentTracking(trackingList.EMAIL_MODAL);
  const modalOpenTime = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (open) {
      modalOpenTime.current = Date.now();
      trackClick("modal_opened", {
        modal_type: "email_collection",
        trigger_source: "cta_button",
      });
    }
  }, [open, trackClick]);

  const onSubmitForm = async (data) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data.email);
      }
      trackConversion("email_signup", data.email.length);
      trackFormInteraction("submit_success", "email");
      reset();
      onClose();
    } catch (err) {
      setError("email", {
        type: "manual",
        message: "Something went wrong. Please try again.",
      });
      trackFormInteraction("submit_error", "email", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    trackClick("modal_close", {
      close_method: "close_button",
      email_entered: emailValue?.length > 0,
      time_in_modal: Date.now() - modalOpenTime.current,
      form_completed: false,
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : null)}>
      <DialogContent className="p-6 sm:p-8">
        <div ref={componentRef} className="text-center">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl leading-snug font-bold">
              Join & get early access
            </DialogTitle>
          </DialogHeader>

          <p className="text-muted-foreground mx-auto mb-4 max-w-md text-sm leading-relaxed">
            Join 26,000+ students getting writing assistence and early access to
            new features.
          </p>

          <div className="mt-3">
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-3">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address",
                  },
                }}
                render={({ field }) => (
                  <div>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      aria-invalid={!!errors.email}
                      className={cn("h-11 text-base")}
                    />
                    {errors.email?.message && (
                      <span className="text-destructive mt-1 block text-xs">
                        {errors.email.message}
                      </span>
                    )}
                  </div>
                )}
              />

              <div className="space-y-2">
                <Button
                  // data-umami-event="Form: Join the waitlist"
                  data-rybbit-event="Form: Join the waitlist"
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="h-11 w-full text-base font-semibold"
                >
                  {isSubmitting ? "Subscribing..." : "Join the waitlist"}
                </Button>

                <Button
                  data-umami-event="Form: Maybe later"
                  data-rybbit-event="Form: Maybe later"
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="h-10 w-full text-sm"
                >
                  Maybe later
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
