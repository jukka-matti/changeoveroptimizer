import { cn } from "@/lib/utils";
import { Button } from "./button";
import { TrendingDown, Award, Trophy, X } from "lucide-react";
import type { CelebrationTier } from "@/lib/celebration-utils";

export interface SuccessBannerProps {
  /** The celebration tier */
  tier: Exclude<CelebrationTier, "none">;
  /** Main headline text */
  headline: string;
  /** Supporting description */
  description: string;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Additional class names */
  className?: string;
}

const tierConfig: Record<
  Exclude<CelebrationTier, "none">,
  {
    icon: typeof TrendingDown;
    containerClass: string;
    iconClass: string;
  }
> = {
  good: {
    icon: TrendingDown,
    containerClass: "bg-success-500/10 border-success-500/30",
    iconClass: "text-success-600",
  },
  great: {
    icon: Award,
    containerClass: "bg-gradient-to-r from-success-500/10 to-primary-500/10 border-success-500/30",
    iconClass: "text-success-600",
  },
  exceptional: {
    icon: Trophy,
    containerClass: "bg-gradient-to-r from-success-500/15 via-primary-500/10 to-primary-500/15 border-success-500/40",
    iconClass: "text-success-600",
  },
};

/**
 * Success banner component for celebrating optimization results.
 * Displays a dismissible banner with tier-based styling.
 *
 * @example
 * <SuccessBanner
 *   tier="great"
 *   headline="Great Results!"
 *   description="You achieved a 28% reduction."
 *   onDismiss={handleDismiss}
 * />
 */
export function SuccessBanner({
  tier,
  headline,
  description,
  onDismiss,
  className,
}: SuccessBannerProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 mb-6 animate-slide-in-down",
        config.containerClass,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
            tier === "exceptional" ? "bg-success-500/20" : "bg-success-500/10"
          )}
        >
          <Icon className={cn("h-5 w-5", config.iconClass)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">{headline}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
