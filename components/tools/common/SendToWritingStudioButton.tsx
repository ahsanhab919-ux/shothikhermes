"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  saveWritingStudioSeed,
  type WritingStudioSeedInput,
  type WritingStudioSeedIntent,
} from "@/lib/writing-studio-seed";

interface SendToWritingStudioButtonProps {
  text: string;
  intent?: WritingStudioSeedIntent;
  title?: string;
  source?: "tool" | "twin";
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

export default function SendToWritingStudioButton({
  text,
  intent = "book",
  title,
  source = "tool",
  label = "Send to Writing Studio",
  variant = "outline",
  size = "sm",
  className,
  disabled = false,
}: SendToWritingStudioButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!text?.trim()) return;

    const payload: WritingStudioSeedInput = {
      source,
      title,
      description: text,
      intent,
    };

    saveWritingStudioSeed(payload);

    router.push(`/writing-studio?intent=${intent}&seed=${source}`);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || !text?.trim()}
      onClick={handleClick}
      className={className}
    >
      <ArrowUpRight className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
