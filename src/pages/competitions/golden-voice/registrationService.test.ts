import { describe, expect, it } from 'vitest';
import { buildSignedUploadUrl, resolveUploadTotal, uploadPercent } from './registrationService';

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
    // The production symptom: cross-origin preflight requests report
    // lengthComputable=false / total=0, which previously left the bar at 0%.
    expect(resolveUploadTotal(false, 0, 10_000)).toBe(10_000);
    expect(resolveUploadTotal(true, 0, 10_000)).toBe(10_000);
    expect(resolveUploadTotal(false, Number.NaN, 10_000)).toBe(10_000);
  });

  it('returns 0 when neither total is usable', () => {
    expect(resolveUploadTotal(false, 0, 0)).toBe(0);
    expect(resolveUploadTotal(false, 0, Number.NaN)).toBe(0);
  });
});
