import { toast } from "sonner";

export interface FieldErrors {
  [fieldName: string]: string;
}

/**
 * Parses server validation errors from the errors array into field-specific errors.
 * Assumes error messages start with the field name followed by a description.
 * e.g., "firstName must be shorter than or equal to 100 characters" -> { firstName: "firstName must be shorter than or equal to 100 characters" }
 */
export function parseValidationErrors(errors: string[]): FieldErrors {
  const fieldErrors: FieldErrors = {};

  errors.forEach((error) => {
    const words = error.trim().split(" ");
    if (words.length > 0) {
      const fieldName = words[0];
      fieldErrors[fieldName] = error;
    }
  });

  return fieldErrors;
}

/**
 * Extracts validation errors from an axios error response if available.
 */
export function getServerValidationErrors(error: any): FieldErrors | null {
  if (
    error.response?.data &&
    typeof error.response.data === "object" &&
    error.response.data.errors &&
    Array.isArray(error.response.data.errors)
  ) {
    return parseValidationErrors(error.response.data.errors);
  }
  return null;
}

export const handleError = (err: any) => {
  // Robust server validation error handling
  interface ErrorResponse {
    response?: {
      data?: {
        errors?: string[];
        message?: string;
      };
    };
  }
  const response =
    typeof err === "object" && err !== null && "response" in err
      ? (err as ErrorResponse).response
      : undefined;
  if (
    response?.data?.errors &&
    Array.isArray(response.data.errors) &&
    !response.data.errors[0].includes("Bad Request")
  ) {
    response.data.errors.forEach((e: string) => toast.error(e));
    // Keep modal open for correction
  } else if (response?.data?.message) {
    toast.error(response.data.message);
  } else {
    toast.error("Failed to add customer");
  }
};
