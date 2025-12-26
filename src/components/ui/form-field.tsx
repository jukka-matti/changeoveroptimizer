import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

export interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** ID to link label with input */
  htmlFor: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display (null/undefined = no error) */
  error?: string | null;
  /** Whether to show success indicator (green checkmark) */
  success?: boolean;
  /** Help text shown below the input */
  helpText?: string;
  /** The input element(s) */
  children: React.ReactNode;
  /** Additional class names for the container */
  className?: string;
  /** Hide the label visually (still accessible) */
  hideLabel?: boolean;
}

/**
 * Form field wrapper component that provides consistent structure
 * for labels, inputs, error messages, and success indicators.
 *
 * @example
 * <FormField
 *   label="Study Name"
 *   htmlFor="study-name"
 *   required
 *   error={errors.name}
 *   success={touched.name && !errors.name}
 * >
 *   <Input id="study-name" value={name} onChange={...} />
 * </FormField>
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  success = false,
  helpText,
  children,
  className,
  hideLabel = false,
}: FormFieldProps) {
  const hasError = Boolean(error);
  const showSuccess = success && !hasError;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(hideLabel && "sr-only")}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="relative">
        {children}
        {showSuccess && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {hasError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {helpText && !hasError && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

/**
 * Hook for managing form field validation state.
 * Provides a simple API for tracking touched state and validation.
 */
export function useFormFieldState<T>(initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
  }, []);

  const reset = React.useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setError(null);
  }, [initialValue]);

  return {
    value,
    setValue,
    touched,
    setTouched,
    error,
    setError,
    handleBlur,
    reset,
    isValid: touched && !error,
  };
}
