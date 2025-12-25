import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type MetricCardVariant = "default" | "success" | "warning" | "primary" | "muted";

export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Description text below the value */
  description?: string;
  /** Lucide icon component */
  icon?: LucideIcon;
  /** Color variant */
  variant?: MetricCardVariant;
  /** Secondary value shown below the main value (smaller) */
  subValue?: string;
  /** Additional class name for the card */
  className?: string;
}

const variantStyles: Record<MetricCardVariant, {
  card: string;
  icon: string;
  value: string;
  description: string;
}> = {
  default: {
    card: "",
    icon: "text-muted-foreground",
    value: "",
    description: "text-muted-foreground",
  },
  success: {
    card: "border-success-500/50 bg-success-500/5",
    icon: "text-success-600",
    value: "text-success-600",
    description: "text-success-600 font-medium",
  },
  warning: {
    card: "border-warning-500/50 bg-warning-500/5",
    icon: "text-warning-600",
    value: "text-warning-600",
    description: "text-warning-600 font-medium",
  },
  primary: {
    card: "border-primary/50 bg-primary/5",
    icon: "text-primary",
    value: "text-primary",
    description: "text-primary font-medium",
  },
  muted: {
    card: "",
    icon: "text-muted-foreground",
    value: "text-muted-foreground",
    description: "text-muted-foreground",
  },
};

/**
 * Metric card for displaying key statistics.
 * Used in dashboards and results screens.
 *
 * @example
 * <MetricCard
 *   title="Total Savings"
 *   value="-45 min"
 *   description="25% reduction"
 *   icon={TrendingDown}
 *   variant="success"
 * />
 */
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
  subValue,
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className={cn("h-4 w-4", styles.icon)} />}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
        {(description || subValue) && (
          <p className={cn("text-xs", styles.description)}>
            {description}
            {subValue && description && " "}
            {subValue && (
              <span className="text-muted-foreground font-normal">{subValue}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
