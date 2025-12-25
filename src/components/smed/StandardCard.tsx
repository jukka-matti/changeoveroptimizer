import { Standard } from '@/types/smed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, FileText, Shield, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StandardCardProps {
  standard: Standard;
  onPublish: (standardId: string) => void;
  onDeactivate: (standardId: string) => void;
  onExportPDF: (standard: Standard) => void;
}

export function StandardCard({
  standard,
  onPublish,
  onDeactivate,
  onExportPDF,
}: StandardCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              Version {standard.version}
            </CardTitle>
            {standard.isActive && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {!standard.isActive && (
              <Button
                size="sm"
                onClick={() => onPublish(standard.id)}
              >
                {t('smed.publish')}
              </Button>
            )}
            {standard.isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeactivate(standard.id)}
              >
                {t('smed.deactivate')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExportPDF(standard)}
            >
              <FileText className="h-4 w-4 mr-1" />
              {t('common.export')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Standard Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {Math.round(standard.standardTimeMinutes)} {t('smed.minutes')}
          </span>
          <span className="text-muted-foreground">
            ({standard.steps.length} steps)
          </span>
        </div>

        {/* Tools Required */}
        {standard.toolsRequired.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-muted-foreground text-xs mb-1">
                {t('smed.tools_required')}
              </div>
              <div className="flex flex-wrap gap-1">
                {standard.toolsRequired.map((tool, idx) => (
                  <Badge key={idx} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Precautions */}
        {standard.safetyPrecautions && (
          <div className="flex items-start gap-2 text-sm">
            <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-muted-foreground text-xs mb-1">
                {t('smed.safety_precautions')}
              </div>
              <p className="text-sm line-clamp-2">{standard.safetyPrecautions}</p>
            </div>
          </div>
        )}

        {/* Published Info */}
        {standard.publishedAt && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {t('smed.published_on')}: {new Date(standard.publishedAt).toLocaleDateString()}
            {standard.publishedBy && ` by ${standard.publishedBy}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
