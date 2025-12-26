import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, X, ArrowRight, Info } from 'lucide-react';
import type { StandardPublishData } from '@/types/smed';
import { changeoverIpc } from '@/lib/electron-ipc';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StandardPublishFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StandardPublishData) => Promise<void>;
  changeoverType?: string | null;
  newStandardTime?: number;
}

export function StandardPublishForm({ isOpen, onClose, onSubmit, changeoverType, newStandardTime }: StandardPublishFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOptimizerTime, setCurrentOptimizerTime] = useState<number | null>(null);

  // Form state
  const [toolsRequired, setToolsRequired] = useState<string[]>([]);
  const [newTool, setNewTool] = useState('');
  const [safetyPrecautions, setSafetyPrecautions] = useState('');
  const [publishedBy, setPublishedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [updateOptimizer, setUpdateOptimizer] = useState(true);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setToolsRequired([]);
      setNewTool('');
      setSafetyPrecautions('');
      setPublishedBy('');
      setNotes('');
      setUpdateOptimizer(true);
      setCurrentOptimizerTime(null);

      // Fetch current optimizer time for comparison
      if (changeoverType) {
        changeoverIpc.getAttributeByName(changeoverType).then((attr) => {
          if (attr) {
            setCurrentOptimizerTime(attr.defaultMinutes);
          }
        });
      }
    }
  }, [isOpen, changeoverType]);

  const handleAddTool = () => {
    if (newTool.trim()) {
      setToolsRequired([...toolsRequired, newTool.trim()]);
      setNewTool('');
    }
  };

  const handleRemoveTool = (index: number) => {
    setToolsRequired(toolsRequired.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        toolsRequired,
        safetyPrecautions: safetyPrecautions.trim() || undefined,
        publishedBy: publishedBy.trim() || undefined,
        notes: notes.trim() || undefined,
        updateOptimizer,
      });
      onClose();
    } catch (error) {
      console.error('Failed to publish standard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('smed.publish_standard')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tools Required */}
          <div className="space-y-2">
            <Label>{t('smed.tools_required')}</Label>
            <div className="flex gap-2">
              <Input
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder={t('smed.add_tool_placeholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTool();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTool} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {toolsRequired.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {toolsRequired.map((tool, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                    <span className="text-sm">{tool}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTool(idx)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Safety Precautions */}
          <div className="space-y-2">
            <Label htmlFor="safety">{t('smed.safety_precautions')}</Label>
            <Textarea
              id="safety"
              value={safetyPrecautions}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSafetyPrecautions(e.target.value)}
              placeholder={t('smed.safety_placeholder')}
              rows={3}
            />
          </div>

          {/* Published By */}
          <div className="space-y-2">
            <Label htmlFor="publishedBy">{t('smed.published_by')}</Label>
            <Input
              id="publishedBy"
              value={publishedBy}
              onChange={(e) => setPublishedBy(e.target.value)}
              placeholder={t('smed.published_by_placeholder')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('smed.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              placeholder={t('smed.notes_placeholder')}
              rows={2}
            />
          </div>

          {/* Update Optimizer Rules */}
          <div className="space-y-3 border p-3 rounded-md bg-muted/20">
            <div className="flex items-center space-x-2">
              <Switch
                id="update-optimizer"
                checked={updateOptimizer}
                onCheckedChange={setUpdateOptimizer}
              />
              <div className="flex-1">
                <Label htmlFor="update-optimizer" className="font-medium cursor-pointer">
                  {t('smed.update_optimizer_rules', 'Update Optimizer Rules')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('smed.update_optimizer_rules_desc', 'Automatically update the Optimizer Matrix with this standard time.')}
                </p>
              </div>
            </div>

            {/* Smart Preview */}
            {updateOptimizer && changeoverType && newStandardTime !== undefined && (
              <Alert className="bg-background border-muted">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{t('smed.impact_preview', 'Impact:')}</span>
                  {currentOptimizerTime !== null ? (
                    <>
                      <span className="line-through">{Math.round(currentOptimizerTime)}m</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-bold text-green-600">{Math.round(newStandardTime)}m</span>
                      <span className="text-muted-foreground ml-1">
                        ({changeoverType})
                      </span>
                    </>
                  ) : (
                    <span>
                      {t('smed.new_rule_creation', 'New rule will be created for')} <strong>{changeoverType}</strong> ({Math.round(newStandardTime)}m)
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.publishing') : t('smed.publish_standard')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
