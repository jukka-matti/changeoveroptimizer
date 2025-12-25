/**
 * Base types for the ChangeoverOptimizer application
 *
 * These types provide common patterns used across entities, stores, and forms.
 */

/**
 * Base interface for all database entities with standard fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Async state pattern used across Zustand stores
 */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Extended async state with loading message (used in app-store)
 */
export interface AppAsyncState {
  isLoading: boolean;
  loadingMessage: string | null;
  error: AppError | null;
}

/**
 * Structured error type for user-facing error messages
 */
export interface AppError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Utility type for deriving form data from entity types.
 * Automatically omits id, createdAt, updatedAt, and any additional specified keys.
 *
 * @example
 * type StudyFormData = FormData<Study, 'status' | 'currentMinutes'>;
 */
export type FormData<T, OmitKeys extends keyof T = never> = Omit<
  Partial<T>,
  'id' | 'createdAt' | 'updatedAt' | OmitKeys
>;

/**
 * Utility type for making specific properties required in a partial type
 *
 * @example
 * type CreateStudy = RequiredFields<Partial<Study>, 'name'>;
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
