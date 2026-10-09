import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVerify, generateKeyPairSync } from 'node:crypto';
import {
  buildSheetRow,
  createServiceAccountJwt,
  getSheetsConfig,
  parseServiceAccountCredentials,
  regionLabel,
  resetSheetsTokenCache,
  syncGoldenVoiceRegistrations,
  syncRegistrationToSheetBestEffort,
} from './googleSheets.js';
import type { GoldenVoiceSheetRegistration } from './googleSheets.js';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const REGISTRATION: GoldenVoiceSheetRegistration = {
  id: '11111111-1111-4111-8111-111111111111',
  fullName: 'سعاد العلمي',
  phone: '0612345678',
  age: 22,
  city: 'بني ملال',
  region: 'beni_mellal_khenifra',
  createdAt: '2026-10-09T12:00:00.000Z',
  videoPath: null,
};

beforeEach(() => {
  resetSheetsTokenCache();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetSheetsTokenCache();
});

describe('parseServiceAccountCredentials', () => {
  it('reads the full service-account JSON', () => {
    const credentials = parseServiceAccountCredentials(
      JSON.stringify({ client_email: 'svc@example.com', private_key: privateKey }),
      undefined,
      undefined,
    );
    expect(credentials?.email).toBe('svc@example.com');
    expect(credentials?.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
  });

  it('normalises escaped newlines in the email/private-key pair', () => {
    const credentials = parseServiceAccountCredentials(
      undefined,
      'svc@example.com',
      'line1\\nline2',
    );
    expect(credentials?.privateKey).toBe('line1\nline2');
  });

  it('returns null when nothing is configured', () => {
    expect(parseServiceAccountCredentials(undefined, undefined, undefined)).toBeNull();
    expect(parseServiceAccountCredentials('{not json', undefined, undefined)).toBeNull();
  });
});

describe('regionLabel', () => {
  it('maps approved region identifiers to Arabic labels', () => {
    expect(regionLabel('beni_mellal_khenifra')).toBe('جهة بني ملال خنيفرة');
    expect(regionLabel('other')).toBe('جهة أخرى');
    expect(regionLabel('unknown')).toBe('unknown');
  });
});

describe('buildSheetRow', () => {
  it('maps a registration to the 8 worksheet columns', () => {
    expect(buildSheetRow(REGISTRATION)).toEqual([
      REGISTRATION.id,
      REGISTRATION.fullName,
      REGISTRATION.phone,
      REGISTRATION.age,
      REGISTRATION.city,
      'جهة بني ملال خنيفرة',
      REGISTRATION.createdAt,
      '',
    ]);
  });
});

describe('createServiceAccountJwt', () => {
  it('produces a verifiable RS256 JWT with the Sheets scope', () => {
    const jwt = createServiceAccountJwt('svc@example.com', privateKey, 1000);
    const [header, claims, signature] = jwt.split('.');

    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${header}.${claims}`);
    verifier.end();
    expect(verifier.verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);

    const decoded = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8')) as {
      iss: string;
      scope: string;
      exp: number;
    };
    expect(decoded.iss).toBe('svc@example.com');
    expect(decoded.scope).toContain('spreadsheets');
    expect(decoded.exp).toBe(4600);
  });
});

describe('getSheetsConfig', () => {
  it('returns null without a spreadsheet id or credentials', () => {
    expect(getSheetsConfig()).toBeNull();

    vi.stubEnv('GOOGLE_SHEETS_SPREADSHEET_ID', 'sheet-id');
    expect(getSheetsConfig()).toBeNull();
  });

  it('defaults the worksheet name to Sheet1', () => {
    vi.stubEnv('GOOGLE_SHEETS_SPREADSHEET_ID', 'sheet-id');
    vi.stubEnv(
      'GOOGLE_SERVICE_ACCOUNT_JSON',
      JSON.stringify({ client_email: 'svc@example.com', private_key: privateKey }),
    );

    expect(getSheetsConfig()?.sheetName).toBe('Sheet1');

    vi.stubEnv('GOOGLE_SHEETS_SHEET_NAME', 'Registrations');
    expect(getSheetsConfig()?.sheetName).toBe('Registrations');
  });
});

function configureSheets(): void {
  vi.stubEnv('GOOGLE_SHEETS_SPREADSHEET_ID', 'sheet-id');
  vi.stubEnv('GOOGLE_SHEETS_SHEET_NAME', 'Sheet1');
  vi.stubEnv(
    'GOOGLE_SERVICE_ACCOUNT_JSON',
    JSON.stringify({ client_email: 'svc@example.com', private_key: privateKey }),
  );
}

describe('syncGoldenVoiceRegistrations', () => {
  it('reports "not-configured" when credentials are missing', async () => {
    await expect(syncGoldenVoiceRegistrations([REGISTRATION])).resolves.toEqual({
      ok: false,
      synced: 0,
      reason: 'not-configured',
    });
  });

  it('updates an existing row and appends a new one without duplicates', async () => {
    configureSheets();

    const calls: { url: string; method: string }[] = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ url: String(url), method });

      if (String(url).includes('oauth2.googleapis.com')) {
        return new Response(JSON.stringify({ access_token: 'token', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (method === 'GET') {
        // Header row + an already-synced registration.
        return new Response(JSON.stringify({ values: [['Registration ID'], [REGISTRATION.id]] }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const newRow: GoldenVoiceSheetRegistration = {
      ...REGISTRATION,
      id: '22222222-2222-4222-8222-222222222222',
      region: 'other',
      videoPath: 'golden-voice/22222222-2222-4222-8222-222222222222.mp4',
    };

    await expect(syncGoldenVoiceRegistrations([REGISTRATION, newRow])).resolves.toEqual({
      ok: true,
      synced: 2,
    });

    const updateCall = calls.find((call) => call.method === 'PUT');
    expect(updateCall?.url).toContain('/values/Sheet1!A2%3AH2');

    const appendCall = calls.find(
      (call) => call.method === 'POST' && call.url.includes(':append'),
    );
    expect(appendCall?.url).toContain(':append');
    expect(appendCall?.url).toContain('insertDataOption=INSERT_ROWS');
  });

  it('returns an error result when the token request fails', async () => {
    configureSheets();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('oauth2.googleapis.com')) {
          return new Response('nope', { status: 500 });
        }
        return new Response(JSON.stringify({ values: [] }), { status: 200 });
      }),
    );

    const result = await syncGoldenVoiceRegistrations([REGISTRATION]);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('google-token-failed');
  });
});

describe('syncRegistrationToSheetBestEffort', () => {
  it('returns false (never throws) when the sync is not configured', async () => {
    await expect(syncRegistrationToSheetBestEffort(REGISTRATION)).resolves.toBe(false);
  });
});
