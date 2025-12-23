import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAppStore } from "@/stores/app-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

interface ScreenContainerProps {
  children: React.ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
  const { isLoading, loadingMessage, error, clearError } = useAppStore();

  return (
    <div className="relative flex min-h-screen flex-col min-w-[800px]">
      <Header />
      
      <main className="flex-1 py-8 relative max-w-container-normal mx-auto px-6">
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

        {/* Global Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">{loadingMessage ?? "Loading..."}</p>
            </div>
          </div>
        )}

        {children}
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}
