import { useEffect, useState } from 'react';
import { FileSpreadsheet, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useConfigStore } from '@/stores/config-store';
import { parseConfiguration } from '@/types/configurations';

export function SavedConfigurationsList() {
  const {
    configurations,
    isLoading,
    loadConfigurations,
    deleteConfiguration,
    updateConfigurationName,
  } = useConfigStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, [loadConfigurations]);

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveEdit = async (id: string) => {
    if (editName.trim()) {
      await updateConfigurationName(id, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = async (id: string) => {
    await deleteConfiguration(id);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Saved Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Saved Configurations
        </CardTitle>
        <CardDescription>
          Configurations are automatically saved when you run an optimization.
          When you import a file with matching columns, the configuration is applied automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {configurations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No saved configurations yet. Run an optimization to create one automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {configurations.map((config) => {
              const parsed = parseConfiguration(config);
              const isEditing = editingId === config.id;

              return (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(config.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSaveEdit(config.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium truncate">{config.name}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {parsed.orderIdColumn}
                      </Badge>
                      {parsed.attributes.slice(0, 3).map((attr) => (
                        <Badge
                          key={attr.column}
                          variant="outline"
                          className="text-xs"
                        >
                          {attr.column}
                        </Badge>
                      ))}
                      {parsed.attributes.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{parsed.attributes.length - 3} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used {config.usageCount} time{config.usageCount !== 1 ? 's' : ''}
                      {' · '}
                      Last used: {formatDate(config.lastUsedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleStartEdit(config.id, config.name)}
                      disabled={isEditing}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{config.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(config.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
