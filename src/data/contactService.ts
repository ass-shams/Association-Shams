/**
 * Contact submission service.
 *
 * The form UI never talks to a backend directly — it calls this function. Today
 * it only simulates a request. Later, replace the body with a Supabase insert,
 * a `/api/contact` call or an email service; the form stays unchanged.
 */
export interface ContactMessage {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly subject: string;
  readonly message: string;
}

export async function submitContactMessage(_message: ContactMessage): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
}
