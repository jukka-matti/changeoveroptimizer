import React, { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileDropzoneProps {
  onFileDrop: (buffer: ArrayBuffer, name: string) => void;
  onBrowse: () => void;
  className?: string;
}

export function FileDropzone({ onFileDrop, onBrowse, className }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileDrop(reader.result, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [onFileDrop]);

  return (
    <Card 
      className={cn(
        "hover:border-primary cursor-pointer transition-colors w-full",
        isDragging && "border-primary bg-primary/5",
        className
      )}
      onClick={onBrowse}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Data
        </CardTitle>
        <CardDescription>
          Drop your Excel or CSV production schedule here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-10">
        <div className={cn(
          "border-2 border-dashed rounded-lg p-12 flex flex-col items-center gap-4 w-full transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
        )}>
          <Upload className={cn(
            "h-10 w-10 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Drop file here" : "Drag & drop or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports .xlsx, .xls, .csv, .tsv
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


