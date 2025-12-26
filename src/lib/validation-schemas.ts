import { z } from "zod";

/**
 * Validation schema for changeover time input.
 * Used in ChangeoverConfigList for attribute configuration.
 */
export const changeoverTimeSchema = z
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Must be 0 or greater")
  .max(9999, "Must be less than 10,000 minutes");

/**
 * Validation schema for SMED study name.
 * Used in NewStudyDialog.
 */
export const studyNameSchema = z
  .string()
  .min(1, "Study name is required")
  .max(100, "Must be 100 characters or less");

/**
 * Validation schema for step description.
 * Used in StepForm.
 */
export const stepDescriptionSchema = z
  .string()
  .min(1, "Description is required")
  .max(500, "Must be 500 characters or less");

/**
 * Validation schema for step duration.
 * Ensures at least 1 second total duration.
 */
export const stepDurationSchema = z
  .object({
    minutes: z.number().min(0).max(999),
    seconds: z.number().min(0).max(59),
  })
  .refine((data) => data.minutes > 0 || data.seconds > 0, {
    message: "Duration must be at least 1 second",
    path: ["seconds"],
  });

/**
 * Validation schema for improvement description.
 * Used in ImprovementForm.
 */
export const improvementDescriptionSchema = z
  .string()
  .min(1, "Description is required")
  .max(500, "Must be 500 characters or less");

/**
 * Validation schema for complete step form.
 */
export const stepFormSchema = z.object({
  description: stepDescriptionSchema,
  durationMinutes: z.number().min(0).max(999),
  durationSeconds: z.number().min(0).max(59),
  category: z.enum([
    "preparation",
    "removal",
    "installation",
    "adjustment",
    "cleanup",
    "other",
  ]),
  operationType: z.enum(["internal", "external"]),
  notes: z.string().optional(),
});

/**
 * Validation schema for complete improvement form.
 */
export const improvementFormSchema = z.object({
  description: improvementDescriptionSchema,
  improvementType: z.enum([
    "convert_to_external",
    "streamline_internal",
    "parallelize",
    "eliminate",
    "standardize",
    "quick_release",
    "other",
  ]),
  estimatedSavingsMinutes: z.number().min(0).optional(),
  estimatedSavingsSeconds: z.number().min(0).max(59).optional(),
  estimatedCost: z.number().min(0).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Helper function to validate a value against a schema.
 * Returns error message or null if valid.
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown
): string | null {
  const result = schema.safeParse(value);
  if (result.success) {
    return null;
  }
  return result.error.errors[0]?.message || "Invalid value";
}
