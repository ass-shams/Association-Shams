import { getSupabaseAdmin } from './supabaseAdmin.js';

/**
 * One-time upload tickets.
 *
 * A ticket is created only after server-side Turnstile verification and binds a
 * registration to one server-generated object path. It is claimed atomically by
 * the registration endpoint (a single conditional `UPDATE`), so a ticket can
 * never be replayed, and the object path always comes from the ticket rather
 * than from the client — preventing arbitrary path injection.
 */
export const UPLOAD_TICKETS_TABLE = 'golden_voice_upload_tickets';

/** Ticket lifetime: long enough for a large upload, short enough to limit abuse. */
export const UPLOAD_TICKET_TTL_SECONDS = 30 * 60;

export type CreateTicketResult = { ok: true; id: string } | { ok: false; reason: 'unavailable' };

export type ClaimTicketResult =
  | { ok: true; objectPath: string }
  | { ok: false; reason: 'invalid' | 'unavailable' };

export async function createUploadTicket(
  objectPath: string,
  region: string,
): Promise<CreateTicketResult> {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  const expiresAt = new Date(Date.now() + UPLOAD_TICKET_TTL_SECONDS * 1000).toISOString();

  try {
    const { data, error } = await client
      .from(UPLOAD_TICKETS_TABLE)
      .insert({ object_path: objectPath, region, expires_at: expiresAt })
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.error('tickets: create failed', error?.code ?? 'unknown');
      return { ok: false, reason: 'unavailable' };
    }

    return { ok: true, id: String((data as { id: string }).id) };
  } catch (error) {
    console.error('tickets: create threw', error instanceof Error ? error.name : 'unknown');
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * Atomically claim a ticket. The conditional update only matches an unconsumed,
 * unexpired ticket bound to the expected region; concurrent claims therefore
 * see exactly one winner. Returns `invalid` when the ticket is missing, expired
 * or already used.
 */
export async function claimUploadTicket(
  ticketId: string,
  region: string,
): Promise<ClaimTicketResult> {
  let client;
  try {
    client = getSupabaseAdmin();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  try {
    const { data, error } = await client
      .from(UPLOAD_TICKETS_TABLE)
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('region', region)
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('object_path')
      .maybeSingle();

    if (error) {
      console.error('tickets: claim failed', error.code ?? 'unknown');
      return { ok: false, reason: 'unavailable' };
    }

    if (!data) {
      return { ok: false, reason: 'invalid' };
    }

    return { ok: true, objectPath: String((data as { object_path: string }).object_path) };
  } catch (error) {
    console.error('tickets: claim threw', error instanceof Error ? error.name : 'unknown');
    return { ok: false, reason: 'unavailable' };
  }
}
