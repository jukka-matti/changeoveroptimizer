import { X, Lightbulb } from 'lucide-react';
import { Button } from './button';
import { useFirstTimeHint } from '@/hooks/useFirstTimeHint';

interface FirstTimeHintProps {
  hintKey: string;
  message: string;
}

export function FirstTimeHint({ hintKey, message }: FirstTimeHintProps) {
  const { showHint, dismissHint } = useFirstTimeHint(hintKey);

  if (!showHint) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg text-sm">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="flex-1 text-muted-foreground">{message}</p>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 shrink-0"
        onClick={dismissHint}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Dismiss hint</span>
      </Button>
    </div>
  );
}
