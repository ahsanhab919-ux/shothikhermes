"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Crown,
  Check,
  X,
  Sparkles,
  BookOpen,
  FileSearch,
  Zap,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";

const FREE_FEATURES = [
  { text: "3 AI actions per day", included: true },
  { text: "Basic readability analysis", included: true },
  { text: "5 citation lookups per day", included: true },
  { text: "Export to TXT only", included: true },
  { text: "Unlimited AI actions", included: false },
  { text: "AI detection scans", included: false },
  { text: "Plagiarism checking", included: false },
  { text: "Advanced writing analysis", included: false },
  { text: "Export to DOCX/HTML", included: false },
  { text: "Priority support", included: false },
];

const PRO_FEATURES = [
  { text: "Unlimited AI actions", included: true },
  { text: "Full readability & tone analysis", included: true },
  { text: "Unlimited citation lookups", included: true },
  { text: "AI detection scans", included: true },
  { text: "Plagiarism checking", included: true },
  { text: "Export to DOCX/HTML/TXT", included: true },
  { text: "Advanced writing templates", included: true },
  { text: "Priority support", included: true },
];

export function WritingStudioUpgradeModal({ open, onClose, limitType = "ai_actions" }) {
  const limitMessages = {
    ai_actions: "You've used all your free AI actions for today",
    citations: "You've reached your daily citation lookup limit",
    export: "DOCX and HTML export requires an upgrade",
    ai_scan: "AI detection scans require an upgrade",
    plagiarism: "Plagiarism checking requires an upgrade",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-yellow-500" />
            Upgrade to Academic Pro
          </DialogTitle>
          <DialogDescription>
            {limitMessages[limitType] || "Unlock the full power of Writing Studio"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Card className="p-4 border-muted">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Free</h3>
              <Badge variant="secondary">Current</Badge>
            </div>
            <p className="text-2xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
            <ul className="space-y-2">
              {FREE_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={!feature.included ? "text-muted-foreground" : ""}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 border-primary ring-2 ring-primary/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic Pro
              </h3>
              <Badge className="bg-gradient-to-r from-primary to-purple-500">Recommended</Badge>
            </div>
            <p className="text-2xl font-bold mb-4">
              $9<span className="text-sm font-normal text-muted-foreground">/month</span>
              <span className="text-xs text-muted-foreground ml-2">or $79/year</span>
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {feature.text}
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <Link href="/pricing">
              <Button className="w-full" size="lg">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Student-friendly pricing. Cancel anytime.
            </p>
          </Card>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 mt-2">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Perfect for thesis & research writing</p>
              <p className="text-xs text-muted-foreground mt-1">
                Join thousands of master's and PhD students who use Writing Studio to get reviewer-grade feedback before submitting.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsageLimitBanner({ used, limit, type = "AI actions" }) {
  const remaining = Math.max(0, limit - used);
  const percentage = (used / limit) * 100;
  
  if (remaining > 1) return null;
  
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
      remaining === 0 ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"
    }`}>
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <span>
          {remaining === 0 
            ? `Daily ${type} limit reached` 
            : `${remaining} ${type} remaining today`}
        </span>
      </div>
      <Link href="/pricing">
        <Button size="sm" variant="ghost" className="h-7 text-xs">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}

export const USAGE_LIMITS = {
  free: {
    ai_actions: 3,
    citations: 5,
    ai_scans: 0,
    export_formats: ["txt"],
  },
  pro: {
    ai_actions: Infinity,
    citations: Infinity,
    ai_scans: Infinity,
    export_formats: ["txt", "html", "docx"],
  },
};
