import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Screen } from "@/types";

export interface StepDefinition {
  /** Screen identifier */
  id: Screen;
  /** Full label for normal screens */
  label: string;
  /** Short label for narrow screens */
  shortLabel?: string;
}

/**
 * The 5-step optimization workflow.
 * Steps are ordered by sequence in the user journey.
 */
export const WORKFLOW_STEPS: StepDefinition[] = [
  { id: "data-preview", label: "Preview Data", shortLabel: "Preview" },
  { id: "column-mapping", label: "Map Columns", shortLabel: "Map" },
  { id: "changeover-config", label: "Configure", shortLabel: "Config" },
  { id: "results", label: "Results" },
  { id: "export", label: "Export" },
];

/**
 * Check if a screen is part of the main optimization workflow.
 */
export function isWorkflowScreen(screen: Screen): boolean {
  return WORKFLOW_STEPS.some((step) => step.id === screen);
}

/**
 * Get the index of a screen in the workflow (0-based).
 * Returns -1 if the screen is not in the workflow.
 */
export function getStepIndex(screen: Screen): number {
  return WORKFLOW_STEPS.findIndex((step) => step.id === screen);
}

export interface ProgressStepperProps {
  /** Current active screen */
  currentStep: Screen;
  /** Callback when a completed step is clicked */
  onStepClick?: (step: Screen) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Progress stepper component showing the user's position in the optimization workflow.
 * Displays 5 steps with circles, numbers/checkmarks, labels, and connecting lines.
 *
 * @example
 * <ProgressStepper
 *   currentStep="column-mapping"
 *   onStepClick={(step) => navigateTo(step)}
 * />
 */
export function ProgressStepper({
  currentStep,
  onStepClick,
  className,
}: ProgressStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {WORKFLOW_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        const isClickable = isCompleted && onStepClick;

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle + Label */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[50px] normal:min-w-[70px]",
                isClickable && "cursor-pointer group",
                !isClickable && "cursor-default"
              )}
              aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCompleted && isClickable && "group-hover:ring-2 group-hover:ring-primary/30",
                  isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium transition-colors whitespace-nowrap",
                  isCompleted && "text-primary",
                  isCompleted && isClickable && "group-hover:underline",
                  isCurrent && "text-foreground",
                  isFuture && "text-muted-foreground"
                )}
              >
                {/* Show short label on narrow screens, full label on normal+ */}
                <span className="normal:hidden">{step.shortLabel || step.label}</span>
                <span className="hidden normal:inline">{step.label}</span>
              </span>
            </button>

            {/* Connecting Line */}
            {index < WORKFLOW_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-[20px] max-w-[60px] mx-1 normal:mx-2 transition-colors",
                  index < currentIndex ? "bg-primary" : "bg-border"
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
