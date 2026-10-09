import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSignedUploadUrl,
  resolveUploadTotal,
  resolveVideoContentType,
  uploadPercent,
  uploadToSignedUrlWithProgress,
} from './registrationService';

interface FakeProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];

  method = '';
  url = '';
  headers: Record<string, string> = {};
  body: File | null = null;
  status = 200;
  uploadListeners: Record<string, (event: FakeProgressEvent) => void> = {};
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  upload: {
    addEventListener: (type: string, listener: (event: FakeProgressEvent) => void) => void;
  };

  constructor() {
    this.upload = {
      addEventListener: (type, listener) => {
        this.uploadListeners[type] = listener;
      },
    };
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  send(body: File): void {
    this.body = body;
    FakeXMLHttpRequest.instances.push(this);
  }
}

const UPLOAD = { bucket: 'golden-voice-videos', path: 'golden-voice/abc.mp4', token: 'tok' };

beforeEach(() => {
  FakeXMLHttpRequest.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://proj.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('buildSignedUploadUrl', () => {
  it('builds the signed-upload endpoint with an encoded token', () => {
    expect(
      buildSignedUploadUrl(
        'https://proj.supabase.co',
        'golden-voice-videos',
        'golden-voice/abc.mp4',
        'tok en/+',
      ),
    ).toBe(
      'https://proj.supabase.co/storage/v1/object/upload/sign/golden-voice-videos/golden-voice/abc.mp4?token=tok%20en%2F%2B',
    );
  });

  it('normalises a trailing base slash and duplicate path slashes', () => {
    expect(buildSignedUploadUrl('https://proj.supabase.co/', 'bucket', '/a//b.webm', 't')).toBe(
      'https://proj.supabase.co/storage/v1/object/upload/sign/bucket/a/b.webm?token=t',
    );
  });
});

describe('resolveVideoContentType', () => {
  it('maps mp4/webm files to bucket-allowed MIME types by extension', () => {
    expect(resolveVideoContentType(new File([], 'clip.mp4', { type: 'video/mp4' }))).toBe(
      'video/mp4',
    );
    expect(resolveVideoContentType(new File([], 'clip.MP4', {}))).toBe('video/mp4');
    expect(resolveVideoContentType(new File([], 'clip.webm', { type: 'video/webm' }))).toBe(
      'video/webm',
    );
    expect(resolveVideoContentType(new File([], 'clip.WEBM', {}))).toBe('video/webm');
  });

  it('falls back to the file type, then to mp4', () => {
    expect(resolveVideoContentType(new File([], 'noext', { type: 'video/webm' }))).toBe(
      'video/webm',
    );
    expect(resolveVideoContentType(new File([], 'clip.mov', { type: 'video/quicktime' }))).toBe(
      'video/mp4',
    );
  });
});

describe('uploadPercent', () => {
  it('rounds and clamps the transmitted ratio to 0–100', () => {
    expect(uploadPercent(0, 100)).toBe(0);
    expect(uploadPercent(1, 4)).toBe(25);
    expect(uploadPercent(1, 3)).toBe(33);
    expect(uploadPercent(2, 3)).toBe(67);
    expect(uploadPercent(100, 100)).toBe(100);
    expect(uploadPercent(150, 100)).toBe(100);
    expect(uploadPercent(-5, 100)).toBe(0);
  });

  it('returns 0 when the total size is unknown', () => {
    expect(uploadPercent(10, 0)).toBe(0);
    expect(uploadPercent(10, Number.NaN)).toBe(0);
    expect(uploadPercent(10, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('resolveUploadTotal', () => {
  it('uses the browser-reported total when it is computable', () => {
    expect(resolveUploadTotal(true, 12_345, 10_000)).toBe(12_345);
  });

  it('falls back to the file size when the body length is not exposed', () => {
    expect(resolveUploadTotal(false, 0, 10_000)).toBe(10_000);
    expect(resolveUploadTotal(true, 0, 10_000)).toBe(10_000);
    expect(resolveUploadTotal(false, Number.NaN, 10_000)).toBe(10_000);
  });

  it('returns 0 when neither total is usable', () => {
    expect(resolveUploadTotal(false, 0, 0)).toBe(0);
    expect(resolveUploadTotal(false, 0, Number.NaN)).toBe(0);
  });
});

describe('uploadToSignedUrlWithProgress', () => {
  it('PUTs the raw file to the signed URL with only the required headers', async () => {
    const file = new File([new Uint8Array(128)], 'clip.mp4', { type: 'video/mp4' });
    const onPercent = vi.fn();

    const promise = uploadToSignedUrlWithProgress(UPLOAD, file, onPercent);
    const xhr = FakeXMLHttpRequest.instances[0];

    expect(xhr.method).toBe('PUT');
    expect(xhr.url).toBe(
      'https://proj.supabase.co/storage/v1/object/upload/sign/golden-voice-videos/golden-voice/abc.mp4?token=tok',
    );
    expect(xhr.headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer anon-key',
      'x-upsert': 'false',
      'content-type': 'video/mp4',
    });
    // Raw body (never a guessed multipart payload).
    expect(xhr.body).toBe(file);
    expect(xhr.body).not.toBeInstanceOf(FormData);

    xhr.onload?.();
    await expect(promise).resolves.toBeUndefined();
    expect(onPercent).toHaveBeenLastCalledWith(100);
  });

  it('reports byte-level progress, using the file size when total is hidden', async () => {
    const file = new File([new Uint8Array(1000)], 'clip.webm', { type: 'video/webm' });
    const percents: number[] = [];

    const promise = uploadToSignedUrlWithProgress(
      { bucket: 'golden-voice-videos', path: 'golden-voice/x.webm', token: 't' },
      file,
      (percent) => percents.push(percent),
    );
    const xhr = FakeXMLHttpRequest.instances[0];

    xhr.uploadListeners.progress({ lengthComputable: true, loaded: 250, total: 1000 });
    xhr.uploadListeners.progress({ lengthComputable: false, loaded: 500, total: 0 });
    xhr.uploadListeners.load({ lengthComputable: true, loaded: 1000, total: 1000 });
    xhr.onload?.();

    await promise;
    expect(percents).toContain(25);
    expect(percents).toContain(50);
    expect(percents).toContain(100);
  });

  it('rejects when the upload response is not successful', async () => {
    const file = new File([new Uint8Array(16)], 'clip.mp4', { type: 'video/mp4' });
    const promise = uploadToSignedUrlWithProgress(UPLOAD, file, () => undefined);
    const xhr = FakeXMLHttpRequest.instances[0];

    xhr.status = 400;
    xhr.onload?.();

    await expect(promise).rejects.toThrow();
  });
});
