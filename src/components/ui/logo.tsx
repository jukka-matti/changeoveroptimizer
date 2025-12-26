import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-12 w-12 text-xl",
} as const;

interface LogoProps {
  /** Size variant: sm (24px), md (32px), lg (48px) */
  size?: keyof typeof sizeClasses;
  /** Click handler - typically used for navigation */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * CO Logo component - the ChangeoverOptimizer brand mark.
 *
 * Primary blue background with white "CO" text.
 * Clickable for navigation when onClick is provided.
 *
 * @example
 * <Logo size="lg" onClick={() => navigateTo('welcome')} />
 */
export function Logo({ size = "md", onClick, className }: LogoProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md",
        "transition-transform duration-150",
        onClick && "cursor-pointer hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        sizeClasses[size],
        className
      )}
      {...(onClick && { type: "button", "aria-label": "Go to home" })}
    >
      CO
    </Component>
  );
}
