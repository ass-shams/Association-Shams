import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getMp4DurationFromMoov, getWebmDurationFromInfo } from './mediaDuration';
import {
  VideoTooLargeError,
  collectMp4Metadata,
  collectWebmMetadata,
  createByteReader,
  detectContainer,
} from './metadataStream';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__');

function streamFrom(bytes: Uint8Array, chunkSize = 64 * 1024): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + chunkSize, bytes.length);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
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

/** Minimal valid ISOBMFF: ftyp + large mdat + moov > mvhd. */
function buildMp4(mdatPayloadBytes: number, durationSeconds: number): Uint8Array {
  const timescale = 1000;
  const mvhd = new Uint8Array(8 + 100);
  writeUint32(mvhd, 0, mvhd.length);
  writeAscii(mvhd, 4, 'mvhd');
  writeUint32(mvhd, 20, timescale);
  writeUint32(mvhd, 24, durationSeconds * timescale);

  const moov = new Uint8Array(8 + mvhd.length);
  writeUint32(moov, 0, moov.length);
  writeAscii(moov, 4, 'moov');
  moov.set(mvhd, 8);

  const ftyp = new Uint8Array(16);
  writeUint32(ftyp, 0, 16);
  writeAscii(ftyp, 4, 'ftyp');
  writeAscii(ftyp, 8, 'isom');
  writeAscii(ftyp, 12, 'isom');

  const mdat = new Uint8Array(8 + mdatPayloadBytes);
  writeUint32(mdat, 0, mdat.length);
  writeAscii(mdat, 4, 'mdat');

  const out = new Uint8Array(ftyp.length + mdat.length + moov.length);
  out.set(ftyp, 0);
  out.set(mdat, ftyp.length);
  out.set(moov, ftyp.length + mdat.length);
  return out;
}

describe('detectContainer', () => {
  it('recognises MP4 and WebM magic bytes', () => {
    expect(detectContainer(buildMp4(0, 5).subarray(0, 12))).toBe('mp4');
    expect(detectContainer(readFileSync(path.join(FIXTURES_DIR, 'valid-5s.webm')).subarray(0, 12))).toBe(
      'webm',
    );
  });

  it('rejects unrelated bytes', () => {
    expect(detectContainer(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBeNull();
  });
});

describe('streaming metadata collection', () => {
  it('retains only the small moov box even when mdat is large', async () => {
    const file = buildMp4(8 * 1024 * 1024, 5);
    const reader = createByteReader(streamFrom(file), file.length);

    const head = await reader.peek(12);
    expect(detectContainer(head ?? new Uint8Array())).toBe('mp4');

    const moov = await collectMp4Metadata(reader, 16 * 1024 * 1024);
    await reader.cancel();

    expect(moov).not.toBeNull();
    expect(moov?.length).toBeLessThan(200);
    expect(getMp4DurationFromMoov(moov as Uint8Array)).toBeCloseTo(5);
  });

  it('extracts the WebM Info element from the fixture', async () => {
    const file = readFileSync(path.join(FIXTURES_DIR, 'valid-5s.webm'));
    const reader = createByteReader(streamFrom(file), file.length);
    const info = await collectWebmMetadata(reader, 16 * 1024 * 1024);
    await reader.cancel();

    expect(info).not.toBeNull();
    expect(info?.length).toBeLessThan(4096);
    expect(getWebmDurationFromInfo(info as Uint8Array)).toBeCloseTo(5, 0);
  });

  it('aborts once the stream exceeds the maximum size', async () => {
    const file = buildMp4(4 * 1024 * 1024, 5);
    const reader = createByteReader(streamFrom(file), 1024);

    await expect(reader.readExact(2048)).rejects.toBeInstanceOf(VideoTooLargeError);
  });
});
