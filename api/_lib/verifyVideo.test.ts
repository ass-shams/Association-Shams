import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  VIDEO_DURATION_UNVERIFIABLE_MESSAGE,
  VIDEO_FORMAT_MESSAGE,
  VIDEO_NOT_FOUND_MESSAGE,
  VIDEO_SIZE_MESSAGE,
  VIDEO_TOO_LONG_MESSAGE,
} from '../../src/pages/competitions/golden-voice/validation.js';

/** Mutable storage mock state, shared with the hoisted `vi.mock` factory. */
const state = vi.hoisted(() => ({
  signedUrl: '',
  signedUrlFails: false,
  objectSize: null as number | null,
}));

vi.mock('./supabaseAdmin.js', () => ({
  getSupabaseAdmin: () => ({
    storage: {
      from: () => ({
        info: async () => ({
          data: state.objectSize === null ? null : { size: state.objectSize },
          error: null,
        }),
        createSignedUrl: async () =>
          state.signedUrlFails
            ? { data: null, error: { name: 'not-found' } }
            : { data: { signedUrl: state.signedUrl }, error: null },
        remove: async () => ({ data: null, error: null }),
      }),
    },
  }),
}));

import { verifyVideo } from './goldenVoice.js';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const OBJECT_PATH = 'golden-voice/123e4567-e89b-12d3-a456-426614174000.mp4';

let server: ReturnType<typeof createServer>;
let baseUrl = '';
let currentBody: Uint8Array = new Uint8Array(0);

function serve(body: Uint8Array): void {
  currentBody = body;
  state.signedUrl = `${baseUrl}/object`;
  state.signedUrlFails = false;
  state.objectSize = null;
}

function serveFixture(fileName: string): void {
  serve(readFileSync(path.join(FIXTURES_DIR, fileName)));
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    bytes[offset + index] = text.charCodeAt(index);
  }
}

/** A valid MP4 signature with no `moov` box, so the duration cannot be read. */
function buildMp4WithoutMoov(): Uint8Array {
  const ftyp = new Uint8Array(16);
  writeUint32(ftyp, 0, 16);
  writeAscii(ftyp, 4, 'ftyp');
  writeAscii(ftyp, 8, 'isom');

  const mdat = new Uint8Array(8 + 64);
  writeUint32(mdat, 0, mdat.length);
  writeAscii(mdat, 4, 'mdat');

  const out = new Uint8Array(ftyp.length + mdat.length);
  out.set(ftyp, 0);
  out.set(mdat, ftyp.length);
  return out;
}

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.setHeader('content-type', 'video/mp4');
    res.end(Buffer.from(currentBody));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('verifyVideo', () => {
  it('accepts a short valid MP4', async () => {
    serveFixture('valid-5s.mp4');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts a valid 183-second MP4', async () => {
    serveFixture('valid-183s.mp4');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts a valid 239-second MP4', async () => {
    serveFixture('valid-239s.mp4');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('rejects a 241-second MP4', async () => {
    serveFixture('long-241s.mp4');
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_TOO_LONG_MESSAGE);
    }
  });

  it('accepts a short valid WebM', async () => {
    serveFixture('valid-5s.webm');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts a QuickTime MOV (typical iPhone recording container)', async () => {
    serveFixture('valid-5s.mov');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts an M4V', async () => {
    serveFixture('valid-5s.m4v');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts a 3GP', async () => {
    serveFixture('valid-5s.3gp');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts a Matroska MKV', async () => {
    serveFixture('valid-5s.mkv');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('accepts an AVI', async () => {
    serveFixture('valid-5s.avi');
    await expect(verifyVideo(OBJECT_PATH)).resolves.toEqual({ ok: true });
  });

  it('rejects a 241-second WebM', async () => {
    serveFixture('long-241s.webm');
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_TOO_LONG_MESSAGE);
    }
  });

  it('rejects an image renamed with a .mp4 extension', async () => {
    serveFixture('image-renamed.mp4');
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_FORMAT_MESSAGE);
    }
  });

  it('rejects content that is not a supported video container', async () => {
    serveFixture('not-a-video.bin');
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_FORMAT_MESSAGE);
    }
  });

  it('rejects a video whose duration cannot be read', async () => {
    serve(buildMp4WithoutMoov());
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_DURATION_UNVERIFIABLE_MESSAGE);
    }
  });

  it('validates the real container, not the object path extension', async () => {
    // A genuine MP4 served under a `.avi` path is accepted: the bytes win.
    serveFixture('valid-5s.mp4');
    const result = await verifyVideo(
      'golden-voice/123e4567-e89b-12d3-a456-426614174000.avi',
    );
    expect(result).toEqual({ ok: true });
  });

  it('rejects a truncated video file without crashing', async () => {
    const full = readFileSync(path.join(FIXTURES_DIR, 'valid-5s.mp4'));
    serve(full.subarray(0, 200));
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect([
        VIDEO_DURATION_UNVERIFIABLE_MESSAGE,
        VIDEO_FORMAT_MESSAGE,
      ]).toContain(result.message);
    }
  });

  it('rejects an object whose size exceeds the limit', async () => {
    serveFixture('valid-5s.mp4');
    state.objectSize = 300 * 1024 * 1024;
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_SIZE_MESSAGE);
    }
  });

  it('reports a missing object without throwing', async () => {
    serveFixture('valid-5s.mp4');
    state.signedUrlFails = true;
    const result = await verifyVideo(OBJECT_PATH);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(VIDEO_NOT_FOUND_MESSAGE);
    }
  });
});
