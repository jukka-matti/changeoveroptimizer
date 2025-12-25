import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Form content (fields) */
  children: React.ReactNode;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Text for the submit button (default: "Save") */
  submitLabel?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Text shown while submitting (default: "Loading...") */
  submittingLabel?: string;
  /** Whether to disable the submit button (beyond isSubmitting) */
  submitDisabled?: boolean;
  /** Additional class name for the dialog content */
  className?: string;
  /** Size variant for the dialog */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Reusable form dialog component.
 * Provides consistent structure for modal forms with title, content, and action buttons.
 *
 * @example
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create Improvement"
 *   description="Add a new improvement idea"
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 * >
 *   <div className="grid gap-4">
 *     <Input ... />
 *     <Select ... />
 *   </div>
 * </FormDialog>
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submittingLabel = "Loading...",
  submitDisabled = false,
  className,
  size = "md",
}: FormDialogProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">{children}</div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook for managing form dialog state.
 * Provides common state management for create/edit dialogs.
 *
 * @example
 * const { isOpen, mode, openCreate, openEdit, close, editingItem } = useFormDialog<Improvement>();
 */
export function useFormDialog<T>() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = React.useState<T | null>(null);

  const openCreate = React.useCallback(() => {
    setMode("create");
    setEditingItem(null);
    setIsOpen(true);
  }, []);

  const openEdit = React.useCallback((item: T) => {
    setMode("edit");
    setEditingItem(item);
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setEditingItem(null);
    }, 200);
  }, []);

  return {
    isOpen,
    setIsOpen,
    mode,
    editingItem,
    openCreate,
    openEdit,
    close,
  };
}
