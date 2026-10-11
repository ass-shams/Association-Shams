import type { MembershipFormValues } from '@/pages/public/membership/types';

/**
 * Membership submission service.
 *
 * The form UI never talks to a backend directly — it calls this function. It
 * sends the validated values to the server-side endpoint, which re-validates
 * everything and inserts the application into `public.members` with the service
 * role.
 */
const MEMBERSHIP_ENDPOINT = '/api/membership';

/** Generic Arabic error shown when no safe server message is available. */
export const GENERIC_MEMBERSHIP_ERROR = 'تعذّر إرسال طلب الانخراط. المرجو المحاولة مرة أخرى.';

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
 * Submit the electronic membership form. Resolves only after the server
 * confirms the database insert; rejects with a safe message otherwise.
 */
export async function submitMembershipApplication(
  values: MembershipFormValues,
): Promise<void> {
  const response = await fetch(MEMBERSHIP_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, GENERIC_MEMBERSHIP_ERROR));
  }
}
