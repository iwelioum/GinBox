/**
 * Extracts a user-facing error message from unknown catch values.
 * Handles both nested { error: { code, message } } and legacy flat
 * { error: "CODE" } API response formats, plus standard Error objects.
 */

interface ApiErrorBody {
  code?: string;
  message?: string;
}

interface AxiosLikeError {
  response?: { data?: { error?: string | ApiErrorBody; message?: string } };
  message?: string;
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && ('response' in err || 'message' in err);
}

/** Safely extracts a user-facing message from any thrown value. */
export function extractErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (isAxiosLikeError(err)) {
    const errorData = err.response?.data?.error;
    // Nested format: { error: { code, message } }
    if (typeof errorData === 'object' && errorData !== null) {
      return errorData.message ?? fallback;
    }
    // Legacy flat format: { error: "CODE", message: "..." }
    if (typeof errorData === 'string') {
      return err.response?.data?.message ?? errorData;
    }
    return err.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err) || fallback;
}
