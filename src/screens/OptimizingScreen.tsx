import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function OptimizingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 90); // Cap at 90 until complete
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Optimizing Sequence</h2>
        <p className="text-muted-foreground">
          Running hierarchical greedy grouping and local search refinement...
        </p>
      </div>

      <div className="w-full space-y-2">
        <Progress value={progress} className="h-3" />
        <p className="text-xs text-center text-muted-foreground">
          Processing production orders...
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="p-4 rounded-lg border bg-muted/30 text-center">
          <p className="text-sm font-medium">Phase 1</p>
          <p className="text-xs text-muted-foreground">Grouping</p>
        </div>
        <div className="p-4 rounded-lg border bg-muted/30 text-center opacity-50">
          <p className="text-sm font-medium">Phase 2</p>
          <p className="text-xs text-muted-foreground">Refinement</p>
        </div>
      </div>
    </div>
  );
}


