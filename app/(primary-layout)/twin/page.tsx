"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTwin } from "@/hooks/useTwin";
import { useTranslation } from "@/i18n";
import type { TwinTask, TwinActivityLogEntry, TwinApproval, TwinTransferRequest } from "@/lib/twin-convex";
import TwinAvatar from "@/components/twin/TwinAvatar";
import KnowledgeBar from "@/components/twin/KnowledgeBar";
import TrainingPanel from "@/components/twin/TrainingPanel";
import TaskFeed from "@/components/twin/TaskFeed";
import StyleProfileCard from "@/components/twin/StyleProfileCard";
import TwinOnboarding from "@/components/twin/TwinOnboarding";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Zap,
  Plus,
  Power,
  Search,
  PenLine,
  BarChart2,
  FileText,
  Loader2,
  Shield,
  Activity,
  ArrowRightLeft,
  Key,
  LinkIcon,
  CheckCircle,
  XCircle,
  Unlink,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveWritingStudioSeed } from "@/lib/writing-studio-seed";

function TwinLandingPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Brain className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-3">
          {t("twinDashboard.landingHeadline")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("twinDashboard.landingSubheadline")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t("twinDashboard.landingFeature1Title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("twinDashboard.landingFeature1Desc")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t("twinDashboard.landingFeature2Title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("twinDashboard.landingFeature2Desc")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {t("twinDashboard.landingFeature3Title")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("twinDashboard.landingFeature3Desc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base"
          onClick={() => window.location.href = "/auth/login?intent=twin"}
        >
          <Brain className="h-5 w-5 mr-2" />
          {t("twinDashboard.landingSignIn")}
        </Button>
      </div>
    </div>
  );
}

const TASK_TYPES_CONFIG: { type: "research" | "writing" | "analysis" | "summary"; labelKey: string; icon: React.ElementType }[] = [
  { type: "research", labelKey: "twinDashboard.research", icon: Search },
  { type: "writing", labelKey: "twinDashboard.writing", icon: PenLine },
  { type: "analysis", labelKey: "twinDashboard.analysis", icon: BarChart2 },
  { type: "summary", labelKey: "twinDashboard.summary", icon: FileText },
];

const SKILL_OPTIONS_CONFIG = [
  { key: "book:write", labelKey: "twinDashboard.bookWriting" },
  { key: "book:publish", labelKey: "twinDashboard.bookPublishing" },
  { key: "forum:create", labelKey: "twinDashboard.forumCreation" },
  { key: "forum:post", labelKey: "twinDashboard.forumPosting" },
  { key: "community:preview", labelKey: "twinDashboard.communityPreviews" },
];

function NewTaskModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string; taskType: "research" | "writing" | "analysis" | "summary" }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"research" | "writing" | "analysis" | "summary">("research");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ title, description, taskType });
      onOpenChange(false);
      setTitle("");
      setDescription("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-sm:!max-w-[100vw] max-sm:!h-[100dvh] max-sm:!rounded-none max-sm:!top-0 max-sm:!left-0 max-sm:!translate-x-0 max-sm:!translate-y-0">
        <DialogTitle>{t("twinDashboard.queueTaskTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("twinDashboard.queueTaskTitle")}</DialogDescription>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("twinDashboard.taskType")}</label>
            <div className="grid grid-cols-2 gap-2">
              {TASK_TYPES_CONFIG.map((tc) => {
                const Icon = tc.icon;
                return (
                  <button
                    key={tc.type}
                    onClick={() => setTaskType(tc.type)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-3 text-left transition-all text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                      taskType === tc.type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground/40"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(tc.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("twinDashboard.taskTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("twinDashboard.taskTitlePlaceholder")}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {t("twinDashboard.taskDetails")} <span className="font-normal text-muted-foreground">({t("twinDashboard.taskDetailsOptional")})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("twinDashboard.taskDetailsPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("twinDashboard.queueTask")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmLabel,
  destructive = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button
            className={cn("flex-1", destructive && "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClaimSection({ onClaim }: { onClaim: (token: string) => Promise<void> }) {
  const { t } = useTranslation();
  const [token, setToken] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  const handleClaim = async () => {
    if (!token.trim()) return;
    setClaiming(true);
    setError("");
    try {
      await onClaim(token.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to claim Twin");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          {t("twinDashboard.linkTwin")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("twinDashboard.linkTwinDesc")}
        </p>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={t("twinDashboard.enterToken")}
          className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          onClick={handleClaim}
          disabled={!token.trim() || claiming}
          className="w-full"
        >
          {claiming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
          {t("twinDashboard.claimTwin")}
        </Button>
      </CardContent>
    </Card>
  );
}

function PermissionsTab({
  allowedSkills,
  approvalRequiredActions,
  onUpdate,
}: {
  allowedSkills: string[];
  approvalRequiredActions: string[];
  onUpdate: (data: { allowedSkills?: string[]; approvalRequiredActions?: string[] }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const toggleSkill = async (skill: string) => {
    setSaving(true);
    try {
      const newSkills = allowedSkills.includes(skill)
        ? allowedSkills.filter((s) => s !== skill)
        : [...allowedSkills, skill];
      await onUpdate({ allowedSkills: newSkills });
    } finally {
      setSaving(false);
    }
  };

  const toggleApproval = async (action: string) => {
    setSaving(true);
    try {
      const newActions = approvalRequiredActions.includes(action)
        ? approvalRequiredActions.filter((a) => a !== action)
        : [...approvalRequiredActions, action];
      await onUpdate({ approvalRequiredActions: newActions });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {t("twinDashboard.permissions")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium text-foreground mb-3">{t("twinDashboard.allowedSkills")}</p>
          <div className="space-y-2">
            {SKILL_OPTIONS_CONFIG.map((skill) => (
              <label key={skill.key} className="flex items-center justify-between rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-sm text-foreground">{t(skill.labelKey)}</span>
                <button
                  onClick={() => toggleSkill(skill.key)}
                  disabled={saving}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    allowedSkills.includes(skill.key) ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      allowedSkills.includes(skill.key) ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-3">{t("twinDashboard.requireApproval")}</p>
          <p className="text-xs text-muted-foreground mb-3">{t("twinDashboard.requireApprovalDesc")}</p>
          <div className="space-y-2">
            {SKILL_OPTIONS_CONFIG.map((skill) => (
              <label key={skill.key} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={approvalRequiredActions.includes(skill.key)}
                  onChange={() => toggleApproval(skill.key)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{t(skill.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityLogTab({
  logs,
  hasMore,
  onLoadMore,
}: {
  logs: TwinActivityLogEntry[];
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">{t("twinDashboard.noActivity")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("twinDashboard.noActivityHint")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {t("twinDashboard.activityLog")}
          <span className="ml-auto text-xs font-normal text-muted-foreground">{t("twinDashboard.entries", { count: logs.length })}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{log.action.replace(/_/g, " ")}</p>
                {log.targetResource && (
                  <p className="text-xs text-muted-foreground mt-0.5">Target: {log.targetResource}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary/80"
              onClick={onLoadMore}
            >
              {t("twinDashboard.loadMore")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PendingApprovalsSection({
  approvals,
  onApprove,
  onReject,
}: {
  approvals: TwinApproval[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  if (approvals.length === 0) return null;

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {t("twinDashboard.pendingApprovals")}
          <span className="ml-auto rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">
            {approvals.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div key={approval._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{approval.action.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Requested {new Date(approval.requestedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject(approval._id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onApprove(approval._id)}
                  className="bg-success hover:bg-success/90 text-white"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TransferSection({
  onTransfer,
  onResolveRecipient,
  incomingRequests,
  onAcceptTransfer,
  onRejectTransfer,
}: {
  onTransfer: (toMasterId: string) => Promise<void>;
  onResolveRecipient: (identifier: string) => Promise<{ userId: string; name: string } | null>;
  incomingRequests: TwinTransferRequest[];
  onAcceptTransfer: (args: { requestId: string }) => Promise<unknown>;
  onRejectTransfer: (args: { requestId: string }) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [recipient, setRecipient] = useState("");
  const [resolvedRecipient, setResolvedRecipient] = useState<{ userId: string; name: string } | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  const handleResolve = async () => {
    if (!recipient.trim()) return;
    setResolving(true);
    setResolveError(null);
    setResolvedRecipient(null);
    try {
      const result = await onResolveRecipient(recipient.trim());
      if (result) {
        setResolvedRecipient(result);
      } else {
        setResolveError(t("twinDashboard.noUserFound"));
      }
    } catch {
      setResolveError(t("twinDashboard.noUserFound"));
    } finally {
      setResolving(false);
    }
  };

  const handleTransfer = async () => {
    const targetId = resolvedRecipient?.userId ?? recipient.trim();
    if (!targetId) return;
    setTransferring(true);
    try {
      await onTransfer(targetId);
      setRecipient("");
      setResolvedRecipient(null);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            {t("twinDashboard.transferTwin")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("twinDashboard.transferDesc")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setResolvedRecipient(null);
                setResolveError(null);
              }}
              placeholder={t("twinDashboard.recipientPlaceholder")}
              className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolve}
              disabled={!recipient.trim() || resolving}
              className="shrink-0"
            >
              {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {resolvedRecipient && (
            <div className="rounded-xl bg-success/10 border border-success/30 p-3">
              <p className="text-sm text-foreground font-medium">
                <CheckCircle className="h-4 w-4 inline mr-1 text-success" />
                {t("twinDashboard.found", { name: resolvedRecipient.name })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">ID: {resolvedRecipient.userId}</p>
            </div>
          )}
          {resolveError && (
            <p className="text-xs text-destructive">{resolveError}</p>
          )}
          <Button
            onClick={handleTransfer}
            disabled={!recipient.trim() || transferring}
            variant="outline"
            className="w-full"
          >
            {transferring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRightLeft className="h-4 w-4 mr-2" />}
            {t("twinDashboard.initiateTransfer")}
          </Button>
        </CardContent>
      </Card>

      {incomingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("twinDashboard.incomingTransfers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {incomingRequests.map((req) => (
                <div key={req._id} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">From: {req.fromMasterId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onRejectTransfer({ requestId: req._id })} className="text-destructive">
                      {t("twinDashboard.reject")}
                    </Button>
                    <Button size="sm" onClick={() => onAcceptTransfer({ requestId: req._id })}>
                      {t("twinDashboard.accept")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TwinPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    profile,
    tasks,
    knowledgeSources,
    styleProfile,
    activityLog,
    activityHasMore,
    loadMoreActivity,
    pendingApprovals,
    transferRequests,
    isLoading,
    isOrphan,
    isSaving,
    isTraining,
    trainingProgress,
    userId,
    userName,
    updateProfile,
    trainNow,
    toggleActive,
    queueTask,
    claimTwin,
    requestVerification,
    verifyTwin,
    unlinkTwin,
    updatePermissions,
    revokeAndRotateKey,
    initiateTransfer,
    acceptTransfer,
    rejectTransfer,
    approveAction,
    rejectAction,
    resolveRecipient,
  } = useTwin();

  const [showNewTask, setShowNewTask] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  if (isLoading) {
    if (!userId) {
      return <TwinLandingPage />;
    }
    return (
      <div className="flex h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return <TwinLandingPage />;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <TwinOnboarding
          onComplete={async (data) => {
            await updateProfile({
              name: data.name,
              communicationStyle: data.communicationStyle,
              persona: data.persona,
              expertiseAreas: data.expertiseAreas,
            });
            if (data.writingSample) {
              try {
                await trainNow([data.writingSample]);
              } catch {
              }
            }
          }}
        />
        <div className="container mx-auto max-w-lg px-4 pb-8">
          <div className="border-t border-border pt-6">
            <ClaimSection onClaim={claimTwin} />
          </div>
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((task: TwinTask) => task.status === "running" || task.status === "pending").length;
  const completedTasks = tasks.filter((task: TwinTask) => task.status === "completed").length;

  const handleUnlink = async () => {
    await unlinkTwin();
    setShowUnlinkConfirm(false);
  };

  const handleRevokeKey = async () => {
    try {
      const key = await revokeAndRotateKey();
      if (key) {
        setNewApiKey(key);
      }
    } catch {
      /* handled by API route */
    }
    setShowRevokeConfirm(false);
  };

  const handleContinueInWritingStudio = (task: {
    title: string;
    description?: string;
    result?: string;
    taskType: "research" | "writing" | "analysis" | "summary";
  }) => {
    const intent =
      task.taskType === "writing"
        ? "book"
        : task.taskType === "summary"
        ? "assignment"
        : "research";

    saveWritingStudioSeed({
      source: "twin",
      title: task.title,
      description: task.result || task.description || task.title,
      intent,
    });

    router.push(`/writing-studio?intent=${intent}&seed=twin`);
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <NewTaskModal
        open={showNewTask}
        onOpenChange={setShowNewTask}
        onSubmit={async (data) => { await queueTask(data); }}
      />

      <ConfirmDialog
        open={showUnlinkConfirm}
        onOpenChange={setShowUnlinkConfirm}
        title={t("twinDashboard.unlinkConfirmTitle")}
        message={t("twinDashboard.unlinkConfirmMessage")}
        confirmLabel={t("twinDashboard.unlinkTwin")}
        destructive
        onConfirm={handleUnlink}
      />

      <ConfirmDialog
        open={showRevokeConfirm}
        onOpenChange={setShowRevokeConfirm}
        title={t("twinDashboard.revokeConfirmTitle")}
        message={t("twinDashboard.revokeConfirmMessage")}
        confirmLabel={t("twinDashboard.revokeAndRegenerate")}
        destructive
        onConfirm={handleRevokeKey}
      />

      <Dialog open={!!newApiKey} onOpenChange={() => setNewApiKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t("twinDashboard.newApiKeyTitle")}</DialogTitle>
          <DialogDescription>{t("twinDashboard.newApiKeyWarning")}</DialogDescription>
          {newApiKey && (
            <div className="relative">
              <code className="block rounded-xl bg-muted p-3 text-xs break-all font-mono text-foreground">
                {newApiKey}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1"
                onClick={() => navigator.clipboard.writeText(newApiKey)}
              >
                {t("common.copyToClipboard")}
              </Button>
            </div>
          )}
          <Button className="w-full mt-2" onClick={() => setNewApiKey(null)}>{t("common.done")}</Button>
        </DialogContent>
      </Dialog>

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            {t("twinDashboard.pageTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground max-w-lg">
            {t("twinDashboard.pageDescription")}
          </p>
        </div>
        <Button
          onClick={() => setShowNewTask(true)}
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("twinDashboard.queueTask")}
        </Button>
      </div>

      <PendingApprovalsSection
        approvals={pendingApprovals}
        onApprove={approveAction}
        onReject={rejectAction}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
              <TwinAvatar
                name={profile?.name ?? "Your Twin"}
                isActive={profile?.isActive ?? false}
                knowledgeScore={profile?.knowledgeScore ?? 0}
                trainingStatus={
                  profile?.trainingStatus === "untrained" ||
                  profile?.trainingStatus === "partial" ||
                  profile?.trainingStatus === "trained"
                    ? profile.trainingStatus
                    : "untrained"
                }
                verificationBadge={profile?.verificationBadge}
                lifecycleState={profile?.lifecycleState}
                isOrphan={isOrphan}
                masterName={isOrphan ? undefined : (userName ?? undefined)}
              />

              {profile?.lifecycleState === "unverified" && (
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={requestVerification}
                >
                  <Shield className="h-4 w-4" />
                  {t("twinDashboard.requestVerification")}
                </Button>
              )}

              {profile?.lifecycleState === "pending_verification" && (
                <Button
                  size="sm"
                  className="w-full gap-2"
                  onClick={verifyTwin}
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("twinDashboard.verifyTwin")}
                </Button>
              )}

              <Button
                variant={profile?.isActive ? "outline" : "default"}
                size="sm"
                className={cn(
                  "w-full gap-2",
                  profile?.isActive && "border-success/40 text-success hover:bg-success/10"
                )}
                onClick={() => toggleActive(!profile?.isActive)}
                aria-label={profile?.isActive ? t("twinDashboard.deactivateTwin") : t("twinDashboard.activateTwin")}
              >
                <Power className="h-4 w-4" />
                {profile?.isActive ? t("twinDashboard.deactivateTwin") : t("twinDashboard.activateTwin")}
              </Button>

              {profile?.sourcePlatform && (
                <p className="text-xs text-muted-foreground">
                  {t("twinDashboard.source", { platform: profile.sourcePlatform })}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-foreground">{activeTasks}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("twinDashboard.activeTasks")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("twinDashboard.completed")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                {t("twinDashboard.knowledge")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KnowledgeBar
                score={profile?.knowledgeScore ?? 0}
                sources={knowledgeSources}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/writing-studio")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Open Writing Studio
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/writing-studio?intent=research")}
              >
                <Search className="h-4 w-4 mr-2" />
                Start research workflow
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push("/writing-studio?intent=assignment")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Start assignment workflow
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowUnlinkConfirm(true)}
              >
                <Unlink className="h-4 w-4 mr-2" />
                {t("twinDashboard.unlinkTwin")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowRevokeConfirm(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                {t("twinDashboard.revokeApiKey")}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="tasks">
            <TabsList className="flex w-full mb-4 overflow-x-auto scrollbar-none">
              <TabsTrigger value="tasks" className="flex-1 min-w-[4.5rem] whitespace-nowrap">{t("twinDashboard.tasks")}</TabsTrigger>
              <TabsTrigger value="train" className="flex-1 min-w-[4.5rem] whitespace-nowrap">{t("twinDashboard.train")}</TabsTrigger>
              <TabsTrigger value="permissions" className="flex-1 min-w-[4.5rem] whitespace-nowrap">{t("twinDashboard.permissions")}</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1 min-w-[4.5rem] whitespace-nowrap">{t("twinDashboard.activity")}</TabsTrigger>
              <TabsTrigger value="transfer" className="flex-1 min-w-[4.5rem] whitespace-nowrap">{t("twinDashboard.transfer")}</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <TaskFeed tasks={tasks as any} onContinueInWritingStudio={handleContinueInWritingStudio} />
            </TabsContent>

            <TabsContent value="train">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("twinDashboard.whoAreYou")}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t("twinDashboard.whoAreYouDesc")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <TrainingPanel
                      initialData={{
                        persona: profile?.persona,
                        expertiseAreas: profile?.expertiseAreas,
                        communicationStyle: profile?.communicationStyle as "formal" | "casual" | "academic" | "creative" | undefined,
                        goals: profile?.goals,
                        languages: profile?.languages,
                      }}
                      onSave={async (data) => {
                        await updateProfile(data);
                      }}
                      onTrain={trainNow}
                      isSaving={isSaving}
                      isTraining={isTraining}
                      trainingProgress={trainingProgress}
                    />
                  </CardContent>
                </Card>
                <StyleProfileCard profile={styleProfile} />
              </div>
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsTab
                allowedSkills={profile?.allowedSkills ?? []}
                approvalRequiredActions={profile?.approvalRequiredActions ?? []}
                onUpdate={updatePermissions}
              />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLogTab logs={activityLog} hasMore={activityHasMore} onLoadMore={loadMoreActivity} />
            </TabsContent>

            <TabsContent value="transfer">
              <TransferSection
                onTransfer={initiateTransfer}
                onResolveRecipient={resolveRecipient}
                incomingRequests={transferRequests.incoming}
                onAcceptTransfer={acceptTransfer}
                onRejectTransfer={rejectTransfer}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
