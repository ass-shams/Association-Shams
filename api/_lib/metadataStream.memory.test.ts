import { describe, expect, it } from 'vitest';
import { getMp4DurationFromMoov } from './mediaDuration';
import { collectMp4Metadata, createByteReader } from './metadataStream';

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

const ftyp = new Uint8Array(16);
writeUint32(ftyp, 0, 16);
writeAscii(ftyp, 4, 'ftyp');
writeAscii(ftyp, 8, 'isom');

function buildMoov(durationSeconds: number): Uint8Array {
  const mvhd = new Uint8Array(8 + 100);
  writeUint32(mvhd, 0, mvhd.length);
  writeAscii(mvhd, 4, 'mvhd');
  writeUint32(mvhd, 20, 1000);
  writeUint32(mvhd, 24, durationSeconds * 1000);

  const moov = new Uint8Array(8 + mvhd.length);
  writeUint32(moov, 0, moov.length);
  writeAscii(moov, 4, 'moov');
  moov.set(mvhd, 8);
  return moov;
}

/** Lazily streams ftyp + a huge mdat + a small moov without buffering the file. */
function bigMp4Stream(mdatBytes: number): ReadableStream<Uint8Array> {
  const mdatHeader = new Uint8Array(8);
  writeUint32(mdatHeader, 0, 8 + mdatBytes);
  writeAscii(mdatHeader, 4, 'mdat');

  const zeroChunk = new Uint8Array(1024 * 1024);
  const moov = buildMoov(5);
  let phase = 0;
  let sent = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (phase === 0) {
        controller.enqueue(ftyp);
        phase = 1;
        return;
      }
      if (phase === 1) {
        controller.enqueue(mdatHeader);
        phase = 2;
        return;
      }
      if (phase === 2) {
        if (sent >= mdatBytes) {
          phase = 3;
          return;
        }
        const size = Math.min(zeroChunk.byteLength, mdatBytes - sent);
        sent += size;
        controller.enqueue(zeroChunk.subarray(0, size));
        return;
      }
      if (phase === 3) {
        controller.enqueue(moov);
        phase = 4;
        return;
      }
      controller.close();
    },
  });
}

describe('metadata streaming memory behavior', () => {
  it('keeps heap growth bounded for a ~190 MB stream', async () => {
    const mdatBytes = 190 * 1024 * 1024;
    const before = process.memoryUsage().heapUsed;

    const reader = createByteReader(bigMp4Stream(mdatBytes), mdatBytes + 64 * 1024);
    const moov = await collectMp4Metadata(reader, 16 * 1024 * 1024);
    await reader.cancel();

    const growth = process.memoryUsage().heapUsed - before;
    console.log(
      `[memory] streamed=${(reader.total / 1024 / 1024).toFixed(1)}MB retainedMetadata=${moov?.length ?? 0}B heapGrowth=${(growth / 1024 / 1024).toFixed(1)}MB`,
    );

    expect(moov?.length).toBeLessThan(200);
    expect(getMp4DurationFromMoov(moov as Uint8Array)).toBeCloseTo(5);
    expect(growth).toBeLessThan(40 * 1024 * 1024);
  });
});
