import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { parseTimeInput } from "@/lib/timer-utils";

export interface DurationInputProps {
  /** Current minutes value */
  minutes: number;
  /** Current seconds value */
  seconds: number;
  /** Called when minutes changes */
  onMinutesChange: (value: number) => void;
  /** Called when seconds changes */
  onSecondsChange: (value: number) => void;
  /** Optional label above the inputs */
  label?: string;
  /** Label for minutes field (default: "Minutes") */
  minutesLabel?: string;
  /** Label for seconds field (default: "Seconds") */
  secondsLabel?: string;
  /** Whether the inputs are required */
  required?: boolean;
  /** Whether the inputs are disabled */
  disabled?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** ID prefix for the inputs */
  id?: string;
}

/**
 * Duration input component with separate minutes and seconds fields.
 * Handles validation and clamping of values automatically.
 *
 * @example
 * <DurationInput
 *   minutes={formData.minutes}
 *   seconds={formData.seconds}
 *   onMinutesChange={(m) => setFormData({ ...formData, minutes: m })}
 *   onSecondsChange={(s) => setFormData({ ...formData, seconds: s })}
 *   label="Duration"
 * />
 */
export function DurationInput({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  label,
  minutesLabel = "Minutes",
  secondsLabel = "Seconds",
  required = false,
  disabled = false,
  className,
  id = "duration",
}: DurationInputProps) {
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseTimeInput(e.target.value, "minutes");
    onMinutesChange(value);
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseTimeInput(e.target.value, "seconds");
    onSecondsChange(value);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label
            htmlFor={`${id}-minutes`}
            className="text-xs text-muted-foreground"
          >
            {minutesLabel}
          </Label>
          <Input
            id={`${id}-minutes`}
            type="number"
            min="0"
            max="999"
            value={minutes}
            onChange={handleMinutesChange}
            disabled={disabled}
            required={required}
          />
        </div>
        <div>
          <Label
            htmlFor={`${id}-seconds`}
            className="text-xs text-muted-foreground"
          >
            {secondsLabel}
          </Label>
          <Input
            id={`${id}-seconds`}
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={handleSecondsChange}
            disabled={disabled}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
