import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CheckCheck,
  CheckCircle,
  Circle,
  ClipboardCheck,
  FileText,
  HelpCircle,
  Palette,
  PlayCircle,
} from "lucide-react";

const phases = [
  {
    id: "planning",
    title: "Planning & Analysis",
    icon: ClipboardCheck,
    description:
      "Planner Agent analyzes your requirements and creates presentation blueprint",
    agents: ["Planner Agent"],
    estimatedTime: "30s",
  },
  {
    id: "preferences",
    title: "Preference Collection",
    icon: HelpCircle,
    description:
      "Interactive questions to understand your style and design preferences",
    agents: ["Interactive Chat System"],
    estimatedTime: "2-3 min",
  },
  {
    id: "content",
    title: "Content Generation",
    icon: FileText,
    description:
      "Content Generation Agent researches and creates slide content",
    agents: ["Content Generation Agent", "Slide Structuring Agent"],
    estimatedTime: "45s",
  },
  {
    id: "design",
    title: "Design & Media",
    icon: Palette,
    description:
      "Media selection and layout design with your custom preferences",
    agents: [
      "Media Selection Agent",
      "Layout & Design Agent",
      "Slide Rendering Agent",
    ],
    estimatedTime: "60s",
  },
  {
    id: "validation",
    title: "Quality Validation",
    icon: CheckCheck,
    description:
      "Validator/QA Agent ensures quality and compliance with requirements",
    agents: ["Validator/QA Agent"],
    estimatedTime: "20s",
  },
];

const getStepIcon = (phase, currentPhase, completedPhases) => {
  if (completedPhases.includes(phase.id)) {
    return <CheckCircle className="h-6 w-6" />;
  } else if (currentPhase === phase.id) {
    return <PlayCircle className="h-6 w-6" />;
  } else {
    return <Circle className="h-6 w-6" />;
  }
};

const getStepStatus = (phase, currentPhase, completedPhases) => {
  if (completedPhases.includes(phase.id)) {
    return "completed";
  } else if (currentPhase === phase.id) {
    return "active";
  } else {
    return "pending";
  }
};

export default function PlanningProgressIndicator({
  currentPhase = "planning",
  completedPhases = [],
  progressPercentage = 0,
  estimatedTimeRemaining = null,
  isInteractive = false,
  onPhaseClick,
}) {
  const currentPhaseIndex = phases.findIndex(
    (phase) => phase.id === currentPhase,
  );
  const totalPhases = phases.length;
  const completedCount = completedPhases.length;
  const overallProgress = (completedCount / totalPhases) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold">
            Presentation Generation Progress
          </h3>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex-1">
              <Progress value={overallProgress} className="h-2" />
            </div>
            <span className="text-muted-foreground text-sm">
              {completedCount}/{totalPhases} Complete
            </span>
          </div>

          {estimatedTimeRemaining && (
            <p className="text-muted-foreground text-sm">
              Estimated time remaining: {estimatedTimeRemaining}
            </p>
          )}
        </div>

        {/* Phase Steps */}
        <div className="space-y-0">
          {phases.map((phase, index) => {
            const status = getStepStatus(phase, currentPhase, completedPhases);
            const isClickable =
              isInteractive &&
              (completedPhases.includes(phase.id) || currentPhase === phase.id);
            const isLast = index === phases.length - 1;

            return (
              <div key={phase.id} className="relative">
                {/* Connecting Line */}
                {!isLast && (
                  <div className="border-border absolute top-12 left-3 h-full w-0.5 border-l-2 border-dashed" />
                )}

                <div
                  className={cn(
                    "relative flex gap-4 pb-8",
                    !isClickable && "cursor-default",
                  )}
                  onClick={
                    isClickable ? () => onPhaseClick?.(phase.id) : undefined
                  }
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      status === "completed" &&
                        "bg-primary text-primary-foreground",
                      status === "active" &&
                        "bg-chart-3 text-primary-foreground",
                      status === "pending" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {getStepIcon(phase, currentPhase, completedPhases)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1 flex items-center gap-2">
                      <h4
                        className={cn(
                          "text-base font-medium",
                          status === "completed" && "text-primary",
                          status === "active" &&
                            "text-foreground font-semibold",
                          status === "pending" && "text-muted-foreground",
                        )}
                      >
                        {phase.title}
                      </h4>
                      <Badge
                        variant={status === "pending" ? "secondary" : "default"}
                        className={cn(
                          "h-5 text-xs",
                          status === "completed" &&
                            "bg-primary text-primary-foreground",
                          status === "active" &&
                            "bg-chart-3 text-primary-foreground",
                          status === "pending" &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {phase.estimatedTime}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 text-sm">
                      {phase.description}
                    </p>

                    {/* Phase Details */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs">
                          Active Agents:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {phase.agents.map((agent) => (
                            <Badge
                              key={agent}
                              variant="outline"
                              className="border-primary text-primary h-6 text-xs"
                            >
                              {agent}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {status === "active" && progressPercentage > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1 text-xs">
                            Phase Progress: {Math.round(progressPercentage)}%
                          </p>
                          <Progress
                            value={progressPercentage}
                            className="[&>div]:bg-chart-3 h-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-muted/50 mt-6 rounded-md p-4">
          <p className="text-muted-foreground text-sm">
            <strong>Current Status:</strong>{" "}
            {currentPhase === "planning"
              ? "Analyzing your requirements and creating presentation structure"
              : currentPhase === "preferences"
                ? "Collecting your design preferences for customization"
                : currentPhase === "content"
                  ? "Generating content based on research and your requirements"
                  : currentPhase === "design"
                    ? "Applying design principles and selecting media assets"
                    : currentPhase === "validation"
                      ? "Ensuring quality and validating against requirements"
                      : "Processing complete"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
