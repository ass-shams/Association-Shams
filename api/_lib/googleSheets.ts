import { createSign } from 'node:crypto';
import { REGION_OPTIONS } from '../../src/pages/competitions/golden-voice/constants.js';

/**
 * Server-side Google Sheets synchronization for Golden Voice registrations.
 *
 * Supabase remains the source of truth; this mirrors each registration into a
 * staff-facing worksheet using a service account. It is intentionally small:
 * a signed JWT is exchanged for an access token, the sheet's ID column is read
 * once, and each row is updated in place or appended. Using the registration
 * UUID as the key makes the sync idempotent, so retries and reconciliation
 * never create duplicate rows.
 *
 * Credentials are read from server-only environment variables and are never
 * exposed to the browser.
 */

const SHEETS_API = 'https://sheets.googleapis.com/v4';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_SHEET_NAME = 'Sheet1';
const LAST_COLUMN = 'H';
const TOKEN_EXPIRY_SKEW_MS = 30_000;

/** A single registration as written to the worksheet (8 columns A–H). */
export interface GoldenVoiceSheetRegistration {
  id: string;
  fullName: string;
  phone: string;
  age: number;
  city: string;
  region: string;
  createdAt: string;
  videoPath: string | null;
}

export interface SheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  email: string;
  privateKey: string;
}

export interface SyncResult {
  ok: boolean;
  synced: number;
  reason?: string;
}

/** Human-readable Arabic region label used in the staff-facing sheet. */
export function regionLabel(value: string): string {
  return REGION_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/** Map a registration to the worksheet's column order. */
export function buildSheetRow(registration: GoldenVoiceSheetRegistration): (string | number)[] {
  return [
    registration.id,
    registration.fullName,
    registration.phone,
    registration.age,
    registration.city,
    regionLabel(registration.region),
    registration.createdAt,
    registration.videoPath ?? '',
  ];
}

/** Normalise a PEM key that may have been stored with escaped newlines. */
function normalizePrivateKey(key: string): string {
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

/**
 * Resolve service-account credentials from either the full key JSON or the
 * email/private-key pair. The full JSON (recommended) avoids having to keep the
 * two halves in sync.
 */
export function parseServiceAccountCredentials(
  json: string | undefined,
  email: string | undefined,
  privateKey: string | undefined,
): { email: string; privateKey: string } | null {
  if (json && json.trim()) {
    try {
      const parsed = JSON.parse(json) as { client_email?: unknown; private_key?: unknown };
      if (typeof parsed.client_email === 'string' && typeof parsed.private_key === 'string') {
        return {
          email: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
        };
      }
    } catch {
      // Fall through to the email/private-key pair.
    }
  }

  if (email && email.trim() && privateKey && privateKey.trim()) {
    return { email: email.trim(), privateKey: normalizePrivateKey(privateKey) };
  }

  return null;
}

/** Read the Sheets configuration from the server environment, or null. */
export function getSheetsConfig(): SheetsConfig | null {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  if (!spreadsheetId) {
    return null;
  }

  const credentials = parseServiceAccountCredentials(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );

  if (!credentials) {
    return null;
  }

  return {
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME?.trim() || DEFAULT_SHEET_NAME,
    ...credentials,
  };
}

export function isSheetsSyncConfigured(): boolean {
  return getSheetsConfig() !== null;
}

function base64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** Build a signed RS256 JWT for the Google OAuth token endpoint. */
export function createServiceAccountJwt(
  email: string,
  privateKey: string,
  issuedAtSeconds: number,
): string {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: email,
      scope: SHEETS_SCOPE,
      aud: TOKEN_URL,
      iat: issuedAtSeconds,
      exp: issuedAtSeconds + 3600,
    }),
  );

  const signingInput = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(privateKey);

  return `${signingInput}.${base64Url(signature)}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Test helper: clear the cached access token. */
export function resetSheetsTokenCache(): void {
  cachedToken = null;
}

async function getAccessToken(config: SheetsConfig): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + TOKEN_EXPIRY_SKEW_MS) {
    return cachedToken.value;
  }

  const assertion = createServiceAccountJwt(
    config.email,
    config.privateKey,
    Math.floor(now / 1000),
  );

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error('google-token-failed');
  }

  const data = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
  if (typeof data.access_token !== 'string' || !data.access_token) {
    throw new Error('google-token-missing');
  }

  const expiresIn = Number(data.expires_in) || 3600;
  cachedToken = { value: data.access_token, expiresAt: now + expiresIn * 1000 };
  return cachedToken.value;
}

function sheetRange(config: SheetsConfig, cells: string): string {
  return `${config.sheetName}!${cells}`;
}

/** Read the ID column once and map each registration UUID to its 1-based row. */
async function readExistingRowNumbers(
  token: string,
  config: SheetsConfig,
): Promise<Map<string, number>> {
  const range = sheetRange(config, 'A:A');
  const response = await fetch(
    `${SHEETS_API}/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers: { authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    throw new Error('sheets-read-failed');
  }

  const data = (await response.json()) as { values?: unknown };
  const rows = Array.isArray(data.values) ? (data.values as string[][]) : [];
  const map = new Map<string, number>();

  rows.forEach((row, index) => {
    const id = row?.[0];
    if (typeof id === 'string' && id.trim()) {
      map.set(id.trim(), index + 1);
    }
  });

  return map;
}

async function writeRow(
  token: string,
  config: SheetsConfig,
  registration: GoldenVoiceSheetRegistration,
  rowNumber: number | undefined,
): Promise<void> {
  const body = JSON.stringify({ values: [buildSheetRow(registration)] });
  const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  if (rowNumber) {
    const range = sheetRange(config, `A${rowNumber}:${LAST_COLUMN}${rowNumber}`);
    const response = await fetch(
      `${SHEETS_API}/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { method: 'PUT', headers, body },
    );
    if (!response.ok) {
      throw new Error('sheets-update-failed');
    }
    return;
  }

  const range = sheetRange(config, `A:${LAST_COLUMN}`);
  const response = await fetch(
    `${SHEETS_API}/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', headers, body },
  );
  if (!response.ok) {
    throw new Error('sheets-append-failed');
  }
}

/**
 * Upsert one or more registrations into the worksheet. Idempotent: existing
 * rows are updated in place by registration UUID, new rows are appended.
 */
export async function syncGoldenVoiceRegistrations(
  rows: GoldenVoiceSheetRegistration[],
): Promise<SyncResult> {
  const config = getSheetsConfig();
  if (!config) {
    return { ok: false, synced: 0, reason: 'not-configured' };
  }

  if (rows.length === 0) {
    return { ok: true, synced: 0 };
  }

  try {
    const token = await getAccessToken(config);
    const existing = await readExistingRowNumbers(token, config);
    let synced = 0;

    for (const row of rows) {
      await writeRow(token, config, row, existing.get(row.id));
      synced += 1;
    }

    return { ok: true, synced };
  } catch (error) {
    return {
      ok: false,
      synced: 0,
      reason: error instanceof Error ? error.message : 'unknown',
    };
  }
}

/**
 * Best-effort single-row sync with a small bounded retry. Never throws, so a
 * Sheets failure can never fail or duplicate the Supabase registration.
 */
export async function syncRegistrationToSheetBestEffort(
  registration: GoldenVoiceSheetRegistration,
  attempts = 2,
): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const result = await syncGoldenVoiceRegistrations([registration]);
    if (result.ok) {
      return true;
    }
    if (result.reason === 'not-configured') {
      return false;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return false;
}
