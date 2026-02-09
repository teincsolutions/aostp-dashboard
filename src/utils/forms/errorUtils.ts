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

  const errors = response?.data?.errors;
  const message = response?.data?.message;

  // Translate known server errors into user-friendly messages
  const userMessage = getUserFriendlyMessage(message);

  if (
    Array.isArray(errors) &&
    errors.length > 0 &&
    !errors[0]?.includes("Bad Request")
  ) {
    errors.forEach((e: string) => toast.error(e));
    if (userMessage) {
      toast.error(userMessage);
    }
  } else if (userMessage) {
    toast.error(userMessage);
  } else {
    toast.error("Failed to process the request. Please try again.");
  }
};

/**
 * Maps raw server error messages to user-friendly descriptions.
 */
function getUserFriendlyMessage(message?: string): string | undefined {
  if (!message) return undefined;

  // Prisma unique constraint errors
  if (message.includes("Unique constraint failed")) {
    if (message.includes("paymentCode")) {
      return "A payment with this code already exists. Please try again.";
    }
    return "A record with this value already exists. Please try again.";
  }

  // Strip raw Prisma invocation details from messages shown to users
  if (message.includes("prisma.") && message.includes("invocation")) {
    return "A database error occurred. Please try again or contact support.";
  }

  return message;
}
