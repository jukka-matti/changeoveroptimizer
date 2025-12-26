import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";
import { useAppStore } from "@/stores/app-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { ProgressStepper, isWorkflowScreen } from "@/components/ui/progress-stepper";

interface ScreenContainerProps {
  children: React.ReactNode;
}

/**
 * Main layout container with sidebar navigation.
 *
 * Layout structure:
 * ┌──────────┬─────────────────────────────────────┐
 * │          │ Header                              │
 * │          ├─────────────────────────────────────┤
 * │ Sidebar  │ Progress Stepper (when in workflow) │
 * │          ├─────────────────────────────────────┤
 * │          │ Main Content                        │
 * │          ├─────────────────────────────────────┤
 * │          │ Footer                              │
 * └──────────┴─────────────────────────────────────┘
 */
export function ScreenContainer({ children }: ScreenContainerProps) {
  const { isLoading, loadingMessage, error, clearError, currentScreen, navigateTo } = useAppStore();
  const showStepper = isWorkflowScreen(currentScreen);

  return (
    <div className="flex min-h-screen min-w-[800px]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header />

        {/* Progress Stepper - only for workflow screens */}
        {showStepper && (
          <div className="border-b bg-muted/30 py-4">
            <div className="max-w-container-normal mx-auto px-6">
              <ProgressStepper
                currentStep={currentScreen}
                onStepClick={(step) => navigateTo(step)}
              />
            </div>
          </div>
        )}

        <main className="flex-1 py-8 relative">
          <div className="max-w-container-normal mx-auto px-6">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 max-w-4xl mx-auto">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error: {error.code}</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error.message}</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4" onClick={clearError}>
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {children}
          </div>
        </main>

        <Footer />
      </div>

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">{loadingMessage ?? "Loading..."}</p>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
