/**
 * Contact submission service.
 *
 * The form UI never talks to a backend directly — it calls this function. It
 * sends the validated values (plus the Cloudflare Turnstile token) to the
 * server-side endpoint, which re-validates everything, verifies Turnstile, and
 * inserts the request into `public.contact_requests`.
 */
export interface ContactMessage {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
}

const CONTACT_ENDPOINT = '/api/contact';

/** Generic Arabic error shown when no safe server message is available. */
export const GENERIC_CONTACT_ERROR = 'تعذّر إرسال الرسالة. المرجو المحاولة مرة أخرى.';

/** Read a safe Arabic error message from an API response, if present. */
async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }
  } catch {
    // Ignore non-JSON bodies; fall back to the generic message.
  }

  return fallback;
}

/**
 * Submit the contact form. Resolves only after the server confirms the
 * database insert; rejects with a safe message otherwise.
 */
export async function submitContactMessage(
  message: ContactMessage,
  turnstileToken: string,
): Promise<void> {
  const response = await fetch(CONTACT_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...message, turnstileToken }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, GENERIC_CONTACT_ERROR));
  }
}
