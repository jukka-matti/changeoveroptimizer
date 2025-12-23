import { useAppStore } from '@/stores/app-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, CheckCircle2, ArrowRight } from 'lucide-react';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  onClose?: () => void;
}

export function UpgradePrompt({ 
  title = "Unlock Unlimited Optimization", 
  description = "You've reached the limits of the free tier.",
  onClose
}: UpgradePromptProps) {
  const { navigateTo } = useAppStore();

  const handleUpgrade = () => {
    navigateTo('settings');
    if (onClose) onClose();
  };

  return (
    <Card className="border-primary/50 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Crown className="h-5 w-5 fill-current" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Unlimited production orders (current limit: 50)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Unlimited optimization attributes (current limit: 3)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            PDF Export with company branding
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Save and load configuration templates
          </li>
        </ul>
      </CardContent>
      <CardFooter className="bg-primary/10 py-4 flex gap-2">
        <Button onClick={handleUpgrade} className="w-full">
          Upgrade to Pro
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>Maybe Later</Button>
        )}
      </CardFooter>
    </Card>
  );
}

