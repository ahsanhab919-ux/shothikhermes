"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Mic, 
  Music, 
  Video,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface VideoProgressProps {
  status: string;
  progress: number;
}

const STEPS = [
  { id: 'pending', label: 'Queued', icon: Loader2 },
  { id: 'generating_voice', label: 'Generating Voiceover', icon: Mic },
  { id: 'generating_music', label: 'Generating Music', icon: Music },
  { id: 'rendering', label: 'Rendering Video', icon: Video },
  { id: 'completed', label: 'Completed', icon: CheckCircle },
];

export default function VideoProgress({ status, progress }: VideoProgressProps) {
  const currentStepIndex = STEPS.findIndex(step => step.id === status);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Generation Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="h-2" />
          
          <div className="space-y-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10'
                      : isCompleted
                      ? 'bg-green-500/10'
                      : 'opacity-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-muted'
                  }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'animate-spin' : ''}`} />
                  </div>
                  <span className={`text-sm ${
                    isActive
                      ? 'font-medium text-primary'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  
                  {isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {status === 'failed' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Generation failed. Please try again.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
