/**
 * Extracts a user-facing error message from unknown catch values.
 * Handles Axios-style errors (with response.data.error),
 * standard Error objects, and arbitrary thrown values.
 */

interface AxiosLikeError {
  response?: { data?: { error?: string } };
  message?: string;
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return typeof err === 'object' && err !== null && ('response' in err || 'message' in err);
}

/** Safely extracts a user-facing message from any thrown value, handling Axios errors, standard Errors, and unknown types so catch blocks never surface raw objects to the UI. */
export function extractErrorMessage(err: unknown, fallback = 'Erreur inconnue'): string {
  if (isAxiosLikeError(err)) {
    return err.response?.data?.error ?? err.message ?? fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err) || fallback;
}
