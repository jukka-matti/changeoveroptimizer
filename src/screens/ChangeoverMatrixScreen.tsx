import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/stores/app-store";
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, FileDown } from "lucide-react";
import { SmedImportDialog } from "@/components/features/SmedImportDialog";
import type {
  ChangeoverAttribute,
  ChangeoverMatrixEntry,
  ChangeoverAttributeInput,
} from "@/types/changeover";

export function ChangeoverMatrixScreen() {
  const { navigateTo } = useAppStore();
  const [attributes, setAttributes] = useState<ChangeoverAttribute[]>([]);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const [matrixEntries, setMatrixEntries] = useState<ChangeoverMatrixEntry[]>([]);
  const [uniqueValues, setUniqueValues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newValueInput, setNewValueInput] = useState("");
  const [showNewAttributeForm, setShowNewAttributeForm] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeDisplayName, setNewAttributeDisplayName] = useState("");
  const [newAttributeDefaultTime, setNewAttributeDefaultTime] = useState(10);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Load attributes on mount
  useEffect(() => {
    loadAttributes();
  }, []);

  // Load matrix entries when attribute is selected
  useEffect(() => {
    if (selectedAttributeId) {
      loadMatrixEntries(selectedAttributeId);
    }
  }, [selectedAttributeId]);

  const loadAttributes = async () => {
    try {
      setIsLoading(true);
      const result = await (window as any).electron.invoke("changeover:get_all_attributes");
      setAttributes(result);
      if (result.length > 0 && !selectedAttributeId) {
        setSelectedAttributeId(result[0].id);
      }
    } catch (err) {
      console.error("Failed to load attributes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatrixEntries = async (attributeId: string) => {
    try {
      const result = await (window as any).electron.invoke("changeover:get_matrix", {
        attributeId,
      });
      setMatrixEntries(result);

      // Extract unique values from matrix entries
      const values = new Set<string>();
      result.forEach((entry: ChangeoverMatrixEntry) => {
        values.add(entry.fromValue);
        values.add(entry.toValue);
      });
      setUniqueValues(Array.from(values).sort());
    } catch (err) {
      console.error("Failed to load matrix entries:", err);
    }
  };

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim() || !newAttributeDisplayName.trim()) return;

    try {
      setIsSaving(true);
      const data: ChangeoverAttributeInput = {
        name: newAttributeName.trim().toLowerCase().replace(/\s+/g, "_"),
        displayName: newAttributeDisplayName.trim(),
        hierarchyLevel: attributes.length,
        defaultMinutes: newAttributeDefaultTime,
        sortOrder: attributes.length,
      };
      await (window as any).electron.invoke("changeover:upsert_attribute", { data });
      setShowNewAttributeForm(false);
      setNewAttributeName("");
      setNewAttributeDisplayName("");
      setNewAttributeDefaultTime(10);
      await loadAttributes();
    } catch (err) {
      console.error("Failed to create attribute:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttribute = async (id: string) => {
    try {
      await (window as any).electron.invoke("changeover:delete_attribute", { id });
      if (selectedAttributeId === id) {
        setSelectedAttributeId(null);
        setMatrixEntries([]);
        setUniqueValues([]);
      }
      await loadAttributes();
    } catch (err) {
      console.error("Failed to delete attribute:", err);
    }
  };

  const handleAddValue = () => {
    if (!newValueInput.trim() || uniqueValues.includes(newValueInput.trim())) return;
    setUniqueValues([...uniqueValues, newValueInput.trim()].sort());
    setNewValueInput("");
  };

  const handleRemoveValue = (value: string) => {
    setUniqueValues(uniqueValues.filter((v) => v !== value));
    // Also remove any matrix entries with this value
    setMatrixEntries(
      matrixEntries.filter((e) => e.fromValue !== value && e.toValue !== value)
    );
  };

  const getMatrixTime = (from: string, to: string): number | null => {
    const entry = matrixEntries.find(
      (e) => e.fromValue === from && e.toValue === to
    );
    return entry ? entry.timeMinutes : null;
  };

  const handleMatrixTimeChange = (from: string, to: string, time: string) => {
    const timeValue = parseFloat(time);
    if (isNaN(timeValue) || timeValue < 0) return;

    const existingIndex = matrixEntries.findIndex(
      (e) => e.fromValue === from && e.toValue === to
    );

    if (existingIndex >= 0) {
      const updated = [...matrixEntries];
      updated[existingIndex] = {
        ...updated[existingIndex],
        timeMinutes: timeValue,
      };
      setMatrixEntries(updated);
    } else if (selectedAttributeId) {
      const newEntry: ChangeoverMatrixEntry = {
        id: `temp-${Date.now()}`,
        attributeId: selectedAttributeId,
        fromValue: from,
        toValue: to,
        timeMinutes: timeValue,
        source: "manual",
        smedStudyId: null,
        notes: null,
        createdAt: null,
        updatedAt: null,
      };
      setMatrixEntries([...matrixEntries, newEntry]);
    }
  };

  const handleSaveMatrix = async () => {
    if (!selectedAttributeId) return;

    try {
      setIsSaving(true);
      // Save all matrix entries
      for (const entry of matrixEntries) {
        await (window as any).electron.invoke("changeover:upsert_entry", {
          data: {
            attributeId: entry.attributeId,
            fromValue: entry.fromValue,
            toValue: entry.toValue,
            timeMinutes: entry.timeMinutes,
            source: entry.source,
            notes: entry.notes,
          },
        });
      }
      // Reload to get proper IDs
      await loadMatrixEntries(selectedAttributeId);
    } catch (err) {
      console.error("Failed to save matrix:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSmedImport = async (data: {
    fromValue: string;
    toValue: string;
    timeMinutes: number;
    smedStudyId: string;
    notes?: string;
  }) => {
    if (!selectedAttributeId) return;

    await (window as any).electron.invoke("changeover:import_smed", {
      attributeId: selectedAttributeId,
      ...data,
    });

    // Add values if they don't exist
    const newValues = new Set(uniqueValues);
    newValues.add(data.fromValue);
    newValues.add(data.toValue);
    setUniqueValues(Array.from(newValues).sort());

    // Reload matrix entries
    await loadMatrixEntries(selectedAttributeId);
  };

  const selectedAttribute = attributes.find((a) => a.id === selectedAttributeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Changeover Matrix</h2>
          <p className="text-muted-foreground">
            Define specific changeover times for value-to-value transitions.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigateTo("welcome")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Attributes List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Attributes</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewAttributeForm(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showNewAttributeForm && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <div className="space-y-2">
                <Label>Name (internal)</Label>
                <Input
                  value={newAttributeName}
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="e.g. color"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={newAttributeDisplayName}
                  onChange={(e) => setNewAttributeDisplayName(e.target.value)}
                  placeholder="e.g. Color"
                />
              </div>
              <div className="space-y-2">
                <Label>Default Time (min)</Label>
                <Input
                  type="number"
                  value={newAttributeDefaultTime}
                  onChange={(e) => setNewAttributeDefaultTime(parseFloat(e.target.value))}
                  min={0}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateAttribute} disabled={isSaving}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowNewAttributeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  selectedAttributeId === attr.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setSelectedAttributeId(attr.id)}
              >
                <div>
                  <div className="font-medium">{attr.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    Default: {attr.defaultMinutes} min
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAttribute(attr.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}

            {attributes.length === 0 && !showNewAttributeForm && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attributes defined yet.
              </p>
            )}
          </div>
        </div>

        {/* Matrix Editor */}
        <div className="lg:col-span-3 space-y-4">
          {selectedAttribute ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {selectedAttribute.displayName} Matrix
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(true)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Import from SMED
                  </Button>
                  <Button onClick={handleSaveMatrix} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Matrix"}
                  </Button>
                </div>
              </div>

              {/* Add Value */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add value (e.g. Red, Blue)"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
                />
                <Button variant="outline" onClick={handleAddValue}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Value Chips */}
              {uniqueValues.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uniqueValues.map((value) => (
                    <div
                      key={value}
                      className="px-3 py-1 bg-muted rounded-full text-sm flex items-center gap-2"
                    >
                      {value}
                      <button
                        onClick={() => handleRemoveValue(value)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Matrix Grid */}
              {uniqueValues.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-sm font-medium border">
                          From ↓ / To →
                        </th>
                        {uniqueValues.map((value) => (
                          <th
                            key={value}
                            className="p-2 text-center text-sm font-medium border min-w-[80px]"
                          >
                            {value}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueValues.map((fromValue) => (
                        <tr key={fromValue}>
                          <td className="p-2 text-sm font-medium border">
                            {fromValue}
                          </td>
                          {uniqueValues.map((toValue) => (
                            <td key={toValue} className="p-1 border">
                              {fromValue === toValue ? (
                                <div className="w-full h-8 bg-muted/30 rounded flex items-center justify-center text-xs text-muted-foreground">
                                  —
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  className="h-8 text-center text-sm"
                                  placeholder={`${selectedAttribute.defaultMinutes}`}
                                  value={getMatrixTime(fromValue, toValue) ?? ""}
                                  onChange={(e) =>
                                    handleMatrixTimeChange(fromValue, toValue, e.target.value)
                                  }
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-muted-foreground mt-2">
                    Empty cells use the default time ({selectedAttribute.defaultMinutes} min).
                    Enter specific times for individual transitions.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  <p>Add values to start building the matrix.</p>
                  <p className="text-sm mt-1">
                    Values represent options like "Red", "Blue", "Large", "Small", etc.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">
              <p>Select an attribute to edit its changeover matrix.</p>
            </div>
          )}
        </div>
      </div>

      {/* SMED Import Dialog */}
      {selectedAttribute && (
        <SmedImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          attributeName={selectedAttribute.displayName}
          onImport={handleSmedImport}
        />
      )}
    </div>
  );
}
