import { useAppStore } from "@/stores/app-store";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useEffect, Suspense, lazy } from "react";
import { telemetry } from "@/services/telemetry";

// Lazy load screens to avoid top-level crashes from dependencies
const WelcomeScreen = lazy(() => import("@/screens/WelcomeScreen").then(m => ({ default: m.WelcomeScreen })));
const DataPreviewScreen = lazy(() => import("@/screens/DataPreviewScreen").then(m => ({ default: m.DataPreviewScreen })));
const ColumnMappingScreen = lazy(() => import("@/screens/ColumnMappingScreen").then(m => ({ default: m.ColumnMappingScreen })));
const ChangeoverConfigScreen = lazy(() => import("@/screens/ChangeoverConfigScreen").then(m => ({ default: m.ChangeoverConfigScreen })));
const ResultsScreen = lazy(() => import("@/screens/ResultsScreen").then(m => ({ default: m.ResultsScreen })));
const ExportScreen = lazy(() => import("@/screens/ExportScreen").then(m => ({ default: m.ExportScreen })));
const SettingsScreen = lazy(() => import("@/screens/SettingsScreen").then(m => ({ default: m.SettingsScreen })));

function App() {
  const { currentScreen } = useAppStore();

  // Initialize global shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    console.log('[App] Mounting ChangeoverOptimizer (Lazy Mode)...');
    telemetry.trackEvent('app_start', { platform: window.navigator.platform });
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen />;
      case "data-preview":
        return <DataPreviewScreen />;
      case "column-mapping":
        return <ColumnMappingScreen />;
      case "changeover-config":
        return <ChangeoverConfigScreen />;
      case "results":
        return <ResultsScreen />;
      case "export":
        return <ExportScreen />;
      case "settings":
        return <SettingsScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <ScreenContainer>
      <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading screen...</div>}>
        {renderScreen()}
      </Suspense>
    </ScreenContainer>
  );
}

export default App;
