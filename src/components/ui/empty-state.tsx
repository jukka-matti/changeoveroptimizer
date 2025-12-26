import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export type EmptyStateVariant = "default" | "compact" | "card";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface EmptyStateProps {
  /** Main icon displayed in the center */
  icon: LucideIcon;
  /** Optional badge icon overlay (e.g., Plus for "add" actions) */
  badgeIcon?: LucideIcon;
  /** Main heading text */
  title: string;
  /** Supporting description text */
  description: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary/alternative action */
  secondaryAction?: EmptyStateAction;
  /** Optional hint or tip shown below actions */
  hint?: string;
  /** Display variant */
  variant?: EmptyStateVariant;
  /** Additional class names */
  className?: string;
}

const variantStyles: Record<
  EmptyStateVariant,
  {
    container: string;
    iconWrapper: string;
    iconBg: string;
    icon: string;
    badge: string;
    badgeIcon: string;
    title: string;
    description: string;
  }
> = {
  default: {
    container: "flex flex-col items-center justify-center py-12 px-8 text-center",
    iconWrapper: "relative mb-4",
    iconBg: "h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center",
    icon: "h-7 w-7 text-primary",
    badge: "absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center",
    badgeIcon: "h-3 w-3 text-primary",
    title: "text-lg font-semibold text-foreground mb-2",
    description: "text-sm text-muted-foreground max-w-md mb-6",
  },
  compact: {
    container: "flex flex-col items-center justify-center py-8 px-6 text-center",
    iconWrapper: "relative mb-3",
    iconBg: "h-10 w-10 rounded-full bg-muted flex items-center justify-center",
    icon: "h-5 w-5 text-muted-foreground",
    badge: "absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center",
    badgeIcon: "h-2.5 w-2.5 text-primary",
    title: "text-base font-medium text-foreground mb-1",
    description: "text-sm text-muted-foreground max-w-sm mb-4",
  },
  card: {
    container:
      "flex flex-col items-center justify-center py-12 px-8 text-center border border-dashed rounded-lg",
    iconWrapper: "relative mb-4",
    iconBg: "h-14 w-14 rounded-full bg-muted flex items-center justify-center",
    icon: "h-7 w-7 text-muted-foreground",
    badge: "absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center",
    badgeIcon: "h-3 w-3 text-primary",
    title: "text-lg font-semibold text-foreground mb-2",
    description: "text-sm text-muted-foreground max-w-md mb-6",
  },
};

/**
 * Empty state component for displaying when there's no data.
 * Provides visual feedback and guides users to take action.
 *
 * @example
 * <EmptyState
 *   icon={ClipboardList}
 *   badgeIcon={Plus}
 *   title="No steps recorded"
 *   description="Break down the changeover into individual steps."
 *   action={{ label: "Add Step", onClick: handleAdd, icon: Plus }}
 *   variant="card"
 * />
 */
export function EmptyState({
  icon: Icon,
  badgeIcon: BadgeIcon,
  title,
  description,
  action,
  secondaryAction,
  hint,
  variant = "default",
  className,
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.iconWrapper}>
        <div className={styles.iconBg}>
          <Icon className={styles.icon} />
        </div>
        {BadgeIcon && (
          <div className={styles.badge}>
            <BadgeIcon className={styles.badgeIcon} />
          </div>
        )}
      </div>

      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "ghost"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
            >
              {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {hint && (
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-dashed max-w-sm">
          {hint}
        </p>
      )}
    </div>
  );
}
