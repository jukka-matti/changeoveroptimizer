import { useState, useEffect, useCallback } from 'react';
import { useDataStore } from '@/stores/data-store';
import { useLicenseStore } from '@/stores/license-store';
import { useAppStore } from '@/stores/app-store';
import { useToast } from '@/hooks/use-toast';
import { Template } from '@/types';
import { invoke } from '@/lib/electron';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Save, FolderOpen, Trash2, FileJson, Clock, Crown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function TemplateManager() {
  const { config, setOrderIdColumn, addAttribute } = useDataStore();
  const { tier } = useLicenseStore();
  const { isSaveTemplateDialogOpen, setSaveTemplateDialogOpen } = useAppStore();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isPro = tier === 'pro';

  const loadTemplates = useCallback(async () => {
    if (!isPro) return;
    try {
      const list = await invoke<Template[]>('list_templates');
      setTemplates(list);
    } catch (err) {
      console.error('Failed to list templates:', err);
    }
  }, [isPro]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !config.orderIdColumn) return;

    try {
      setIsLoading(true);
      const newTemplate: Template = {
        id: uuidv4(),
        name: templateName,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        config: {
          orderIdColumn: config.orderIdColumn,
          attributes: config.attributes,
        },
      };

      await invoke('save_template', { template: newTemplate });
      toast({
        title: "Template Saved",
        description: `"${templateName}" has been saved successfully.`,
      });
      setSaveTemplateDialogOpen(false);
      setTemplateName('');
      loadTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save the template.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (template: Template) => {
    // Clear current attributes first
    // In a real app we might want a 'merge' option
    config.attributes.forEach(a => useDataStore.getState().removeAttribute(a.column));

    setOrderIdColumn(template.config.orderIdColumn);
    template.config.attributes.forEach(attr => {
      addAttribute(attr.column, attr.changeoverTime);
    });

    toast({
      title: "Template Loaded",
      description: `"${template.name}" configuration applied.`,
    });
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    try {
      await invoke('delete_template', { id });
      toast({
        title: "Template Deleted",
        description: `"${name}" has been removed.`,
      });
      loadTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  if (!isPro) {
    return (
      <Button variant="outline" size="sm" className="opacity-50" disabled>
        <FileJson className="mr-2 h-4 w-4" />
        Templates
        <Crown className="ml-2 h-3 w-3 text-primary fill-current" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="mr-2 h-4 w-4" />
            Load Template
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {templates.length === 0 ? (
            <DropdownMenuItem disabled>No templates saved</DropdownMenuItem>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-center">
                <DropdownMenuItem
                  className="flex-1"
                  onClick={() => handleLoadTemplate(t)}
                >
                  <div className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2 w-2" />
                      {new Date(t.modified).toLocaleDateString()}
                    </span>
                  </div>
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(t.id, t.name);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!config.orderIdColumn || config.attributes.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Configuration Template</DialogTitle>
            <DialogDescription>
              Save your current column mapping and changeover times for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Standard Production Run"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <p className="font-semibold mb-1">Included in template:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Order ID: {config.orderIdColumn}</li>
                <li>Attributes: {config.attributes.length}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={isLoading || !templateName.trim()}>
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

