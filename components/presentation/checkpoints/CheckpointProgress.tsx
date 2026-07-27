"use client";

/**
 * CheckpointProgress
 * 
 * Step-by-step generation progress with checkpoint saving
 * Inspired by Stitch AI's incremental memory building
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Pause, 
  Play, 
  RotateCcw,
  Save,
  Clock,
  FileText,
  Palette,
  Layers,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckpointStep = 
  | 'outline' 
  | 'design' 
  | 'content' 
  | 'formatting' 
  | 'review';

export interface Checkpoint {
  step: CheckpointStep;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  progress: number;
  data?: any;
  memoryId?: string;
  timestamp?: Date;
}

interface CheckpointProgressProps {
  checkpoints: Checkpoint[];
  currentStep: CheckpointStep;
  overallProgress: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onSaveCheckpoint: (step: CheckpointStep) => void;
  onRollback: (step: CheckpointStep) => void;
  onViewCheckpoint: (step: CheckpointStep) => void;
  className?: string;
}

const stepConfig: Record<CheckpointStep, { label: string; icon: React.ReactNode }> = {
  outline: { 
    label: 'Outline Generation', 
    icon: <FileText className="h-4 w-4" /> 
  },
  design: { 
    label: 'Design System', 
    icon: <Palette className="h-4 w-4" /> 
  },
  content: { 
    label: 'Content Generation', 
    icon: <Layers className="h-4 w-4" /> 
  },
  formatting: { 
    label: 'Formatting & Polish', 
    icon: <Eye className="h-4 w-4" /> 
  },
  review: { 
    label: 'Review & Export', 
    icon: <CheckCircle2 className="h-4 w-4" /> 
  },
};

export function CheckpointProgress({
  checkpoints,
  currentStep,
  overallProgress,
  isPaused,
  onPause,
  onResume,
  onSaveCheckpoint,
  onRollback,
  onViewCheckpoint,
  className,
}: CheckpointProgressProps) {
  const [expandedStep, setExpandedStep] = useState<CheckpointStep | null>(null);

  const getStepStatus = (step: CheckpointStep) => {
    const checkpoint = checkpoints.find(c => c.step === step);
    return checkpoint?.status || 'pending';
  };

  const getStepProgress = (step: CheckpointStep) => {
    const checkpoint = checkpoints.find(c => c.step === step);
    return checkpoint?.progress || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'pending':
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Generation Progress</CardTitle>
          <div className="flex items-center gap-2">
            {isPaused ? (
              <Button size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overall Progress</span>
            <span className="text-sm font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {(Object.keys(stepConfig) as CheckpointStep[]).map((step, index) => {
          const status = getStepStatus(step);
          const progress = getStepProgress(step);
          const config = stepConfig[step];
          const isCurrent = currentStep === step;
          const checkpoint = checkpoints.find(c => c.step === step);

          return (
            <div
              key={step}
              className={cn(
                "border rounded-lg overflow-hidden transition-all",
                isCurrent && "ring-2 ring-primary",
                status === 'completed' && "bg-muted/30"
              )}
            >
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedStep(expandedStep === step ? null : step)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full",
                    status === 'completed' && "bg-green-500/10",
                    status === 'in_progress' && "bg-primary/10",
                    status === 'pending' && "bg-muted"
                  )}>
                    <span className={cn(
                      "text-sm font-medium",
                      status === 'completed' && "text-green-600",
                      status === 'in_progress' && "text-primary",
                      status === 'pending' && "text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className={cn(
                      "font-medium",
                      status === 'pending' && "text-muted-foreground"
                    )}>
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(status)}
                  {getStatusIcon(status)}
                </div>
              </button>

              {expandedStep === step && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Progress bar for this step */}
                  {status === 'in_progress' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Step Progress</span>
                        <span className="text-xs font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Checkpoint info */}
                  {checkpoint?.timestamp && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Completed at {formatTime(checkpoint.timestamp)}</span>
                      {checkpoint.memoryId && (
                        <Badge variant="outline" className="text-xs">
                          Saved to memory
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewCheckpoint(step)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSaveCheckpoint(step)}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRollback(step)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      </>
                    )}

                    {status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSaveCheckpoint(step)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save Progress
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {isPaused 
              ? "Generation paused. You can close this and resume later."
              : "Generation in progress. Progress is automatically saved to memory."
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default CheckpointProgress;
