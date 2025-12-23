import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Settings, Home, Info, Github, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();
  const { currentScreen, navigateTo } = useAppStore();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo("welcome")}
            disabled={currentScreen === "welcome"}
          >
            <Home className="h-5 w-5" />
          </Button>
          <span className="font-bold text-fluid-xl tracking-tight">ChangeoverOptimizer</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg">
                    CO
                  </div>
                </div>
                <DialogTitle className="text-center text-2xl">{t('welcome.title')}</DialogTitle>
                <DialogDescription className="text-center">
                  v1.0.0 Production Optimizer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-center leading-relaxed">
                  ChangeoverOptimizer is a professional desktop application designed for SME manufacturers to minimize production changeover times using advanced sequencing algorithms.
                </p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://changeoveroptimizer.com" target="_blank" rel="noreferrer">
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://github.com/changeoveroptimizer" target="_blank" rel="noreferrer">
                      <Github className="mr-2 h-4 w-4" />
                      Source Code
                    </a>
                  </Button>
                </div>
              </div>
              <div className="text-[10px] text-center text-muted-foreground">
                Built by RDMAIC Oy. All rights reserved.
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo("settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

