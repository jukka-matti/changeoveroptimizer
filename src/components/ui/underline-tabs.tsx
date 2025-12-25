import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional badge (count or text) shown after the label */
  badge?: string | number;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Tooltip shown when hovering over a disabled tab */
  disabledReason?: string;
}

export interface UnderlineTabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Called when a tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Underline-style tab navigation component.
 * Uses border-bottom indicator for active state.
 *
 * @example
 * <UnderlineTabs
 *   tabs={[
 *     { id: 'steps', label: 'Steps', badge: 5 },
 *     { id: 'improvements', label: 'Improvements' },
 *     { id: 'history', label: 'History', disabled: true, disabledReason: 'Coming soon' },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 */
export function UnderlineTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: UnderlineTabsProps) {
  return (
    <div className={cn("flex gap-6", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            disabled={isDisabled}
            title={isDisabled ? tab.disabledReason : undefined}
            className={cn(
              "px-1 py-3 text-sm font-medium border-b-2 transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
              isDisabled && "opacity-50 cursor-not-allowed hover:text-muted-foreground"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-2 text-xs",
                  isDisabled && "opacity-50"
                )}
              >
                ({tab.badge})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Container for the tabs with standard styling.
 * Provides the border and background styling.
 */
export function UnderlineTabsContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b bg-muted/30", className)}>
      <div className="max-w-container-wide mx-auto px-6">{children}</div>
    </div>
  );
}
