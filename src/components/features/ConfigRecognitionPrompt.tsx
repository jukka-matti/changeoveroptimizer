import { CheckCircle2, Settings2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useConfigStore } from '@/stores/config-store';
import { useDataStore } from '@/stores/data-store';
import { useAppStore } from '@/stores/app-store';

interface ConfigRecognitionPromptProps {
  onApplyConfig?: () => void;
  onReviewSettings: () => void;
}

export function ConfigRecognitionPrompt({
  onReviewSettings,
}: ConfigRecognitionPromptProps) {
  const { matchedConfig, showRecognitionPrompt, dismissRecognitionPrompt, recordConfigUsage } =
    useConfigStore();
  const { setOrderIdColumn, addAttribute } = useDataStore();
  const { navigateTo } = useAppStore();

  if (!showRecognitionPrompt || !matchedConfig) {
    return null;
  }

  const handleApplyAndOptimize = async () => {
    // Apply the configuration
    setOrderIdColumn(matchedConfig.orderIdColumn);

    // Clear existing attributes and add saved ones
    for (const attr of matchedConfig.attributes) {
      addAttribute(attr.column, attr.changeoverTime);
    }

    // Record usage
    await recordConfigUsage(matchedConfig.id);

    // Close prompt
    dismissRecognitionPrompt();

    // Navigate to changeover config screen to run optimization
    navigateTo('changeover-config');
  };

  const handleReviewFirst = () => {
    // Apply the configuration but stay for review
    setOrderIdColumn(matchedConfig.orderIdColumn);

    for (const attr of matchedConfig.attributes) {
      addAttribute(attr.column, attr.changeoverTime);
    }

    dismissRecognitionPrompt();
    onReviewSettings();
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary">
              We recognize this file format!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your saved configuration will:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>
                • Use <span className="font-medium text-foreground">"{matchedConfig.orderIdColumn}"</span> as the order identifier
              </li>
              <li>
                • Optimize for{' '}
                {matchedConfig.attributes.map((attr, i) => (
                  <span key={attr.column}>
                    {i > 0 && i < matchedConfig.attributes.length - 1 && ', '}
                    {i > 0 && i === matchedConfig.attributes.length - 1 && ' and '}
                    <span className="font-medium text-foreground">
                      {attr.column}
                    </span>
                    <span className="text-muted-foreground/70"> ({attr.changeoverTime}m)</span>
                  </span>
                ))}
              </li>
            </ul>

            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                {matchedConfig.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Used {matchedConfig.usageCount} time{matchedConfig.usageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleApplyAndOptimize}>
              <Play className="h-4 w-4 mr-1" />
              Optimize Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReviewFirst}
            >
              <Settings2 className="h-4 w-4 mr-1" />
              Review First
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
