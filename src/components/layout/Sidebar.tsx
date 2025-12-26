import { useAppStore } from "@/stores/app-store";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Home, LineChart, ClipboardList, BarChart3, Settings } from "lucide-react";
import type { Screen } from "@/types";

/**
 * Navigation item definition
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  screen: Screen;
  /** Screens that should show this item as active */
  activeScreens: Screen[];
}

/**
 * Main navigation items (top section)
 */
const mainNavItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    screen: "welcome",
    activeScreens: ["welcome"],
  },
  {
    id: "optimizer",
    label: "Optimizer",
    icon: LineChart,
    screen: "data-preview",
    activeScreens: [
      "data-preview",
      "column-mapping",
      "changeover-config",
      "optimizing",
      "results",
      "export",
    ],
  },
  {
    id: "smed",
    label: "SMED",
    icon: ClipboardList,
    screen: "smed",
    activeScreens: ["smed", "timer"],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    screen: "analytics",
    activeScreens: ["analytics"],
  },
];

/**
 * Bottom navigation items
 */
const bottomNavItems: NavItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    screen: "settings",
    activeScreens: ["settings", "changeover-matrix"],
  },
];

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavItemButton({ item, isActive, onClick }: NavItemButtonProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isActive && "bg-primary/10 text-primary border-l-2 border-primary -ml-px pl-[11px]",
        !isActive && "text-muted-foreground hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span>{item.label}</span>
    </button>
  );
}

/**
 * Sidebar navigation component.
 *
 * Enterprise-grade left sidebar with:
 * - CO logo at top (clickable to go home)
 * - Main navigation items (Home, Optimizer, SMED, Analytics)
 * - Settings at bottom
 *
 * @example
 * <div className="flex min-h-screen">
 *   <Sidebar />
 *   <main className="flex-1">...</main>
 * </div>
 */
export function Sidebar() {
  const { currentScreen, navigateTo } = useAppStore();

  const isItemActive = (item: NavItem) => item.activeScreens.includes(currentScreen);

  return (
    <aside className="w-[200px] flex-shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Logo and Brand */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Logo size="md" onClick={() => navigateTo("welcome")} />
          <span className="font-semibold text-sm tracking-tight">Optimizer</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1" aria-label="Main navigation">
        {mainNavItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={isItemActive(item)}
            onClick={() => navigateTo(item.screen)}
          />
        ))}
      </nav>

      {/* Bottom Navigation (Settings) */}
      <div className="p-3 border-t space-y-1">
        {bottomNavItems.map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            isActive={isItemActive(item)}
            onClick={() => navigateTo(item.screen)}
          />
        ))}
      </div>
    </aside>
  );
}
