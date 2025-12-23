import { useState, useCallback } from 'react';
import { useDataStore } from '@/stores/data-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Clock, ChevronUp, ChevronDown, Info } from 'lucide-react';

const PARALLEL_GROUPS = ['default', 'A', 'B', 'C', 'D'] as const;

const groupColors: Record<string, string> = {
  default: 'border-l-gray-300',
  A: 'border-l-blue-500',
  B: 'border-l-green-500',
  C: 'border-l-orange-500',
  D: 'border-l-purple-500',
};

export function ChangeoverConfigList() {
  const { config, updateAttributeTime, setAttributeParallelGroup, reorderAttributes } = useDataStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    // Add a slight delay to allow drag image to be set
    setTimeout(() => {
      if (e.dataTransfer) {
        e.dataTransfer.setDragImage(e.currentTarget as Element, 0, 0);
      }
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderAttributes(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, reorderAttributes]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Changeover Times</CardTitle>
          <CardDescription>
            Specify how many minutes it takes to change each attribute. 
            The order determines optimization priority (top = highest priority).
            Drag items to reorder them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.attributes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No attributes selected. Go back to Column Mapping to select attributes.
            </p>
          ) : (
            <div className="space-y-4">
              {config.attributes.map((attr, index) => (
                <div key={attr.column} className="flex flex-col space-y-4">
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 p-4 rounded-lg border border-l-4 bg-card shadow-sm transition-all ${
                      groupColors[attr.parallelGroup] || groupColors.default
                    } ${
                      draggedIndex === index
                        ? 'opacity-50 cursor-grabbing'
                        : 'cursor-grab'
                    } ${
                      dragOverIndex === index
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                      <div className="space-y-0.5">
                        <Label className="text-base font-semibold">{attr.column}</Label>
                        <p className="text-xs text-muted-foreground">
                          Priority {index + 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index > 0) {
                              reorderAttributes(index, index - 1);
                            }
                          }}
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index < config.attributes.length - 1) {
                              reorderAttributes(index, index + 1);
                            }
                          }}
                          disabled={index === config.attributes.length - 1}
                          title="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-[200px]">
                      <div className="relative flex-1">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          value={attr.changeoverTime || ''}
                          onChange={(e) => updateAttributeTime(attr.column, parseInt(e.target.value) || 0)}
                          className="pl-9"
                          placeholder="Minutes"
                          onDragStart={(e) => e.stopPropagation()}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">min</span>
                    </div>

                    <div className="w-[100px]">
                      <Select
                        value={attr.parallelGroup}
                        onValueChange={(value) => setAttributeParallelGroup(attr.column, value)}
                      >
                        <SelectTrigger
                          className="w-full"
                          onDragStart={(e) => e.stopPropagation()}
                        >
                          <SelectValue placeholder="Group" />
                        </SelectTrigger>
                        <SelectContent>
                          {PARALLEL_GROUPS.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group === 'default' ? 'Default' : `Group ${group}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Parallel Groups
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Attributes in the <strong>same group</strong> can be changed simultaneously
            by different crews (only the longest time counts for downtime).
          </p>
          <p>
            Attributes in <strong>different groups</strong> must be done sequentially
            (times are added together).
          </p>
          <p className="pt-2 text-xs">
            <strong>Example:</strong> If Color (15 min) and Finish (10 min) are in Group A,
            and Material (20 min) is in Group B, a combined changeover takes 15 + 20 = 35 min
            downtime (not 45 min).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

