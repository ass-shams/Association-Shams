/**
 * Streaming container metadata extraction.
 *
 * Instead of buffering an entire (potentially 200 MB) video, this walks the
 * byte stream and retains only the small structural metadata needed to read the
 * duration: the MP4 `moov` box or the WebM `Segment > Info` element. Media
 * payloads are discarded as they stream through, keeping memory bounded to the
 * downloaded chunk plus the metadata cap.
 */

/**
 * Container families the server can inspect:
 * - `isobmff`: MP4, MOV/QuickTime, M4V, 3GP/3G2 (all share the `ftyp` box).
 * - `ebml`: WebM and Matroska (MKV).
 * - `avi`: RIFF/AVI.
 */
export type VideoContainer = 'isobmff' | 'ebml' | 'avi';

/** Thrown when the stream exceeds the configured maximum object size. */
export class VideoTooLargeError extends Error {
  constructor() {
    super('video-too-large');
    this.name = 'VideoTooLargeError';
  }
}

/**
 * Detect the real container from the first bytes of the object. This is the
 * security boundary: the filename extension and the browser MIME type are never
 * trusted on their own.
 */
export function detectContainer(head: Uint8Array): VideoContainer | null {
  // ISOBMFF: a `ftyp` box at bytes 4–7 (MP4, MOV, M4V, 3GP, 3G2).
  if (
    head.length >= 12 &&
    head[4] === 0x66 &&
    head[5] === 0x74 &&
    head[6] === 0x79 &&
    head[7] === 0x70
  ) {
    return 'isobmff';
  }

  // EBML magic (WebM / Matroska).
  if (
    head.length >= 4 &&
    head[0] === 0x1a &&
    head[1] === 0x45 &&
    head[2] === 0xdf &&
    head[3] === 0xa3
  ) {
    return 'ebml';
  }

  // RIFF/AVI: 'RIFF' .... 'AVI '.
  if (
    head.length >= 12 &&
    head[0] === 0x52 &&
    head[1] === 0x49 &&
    head[2] === 0x46 &&
    head[3] === 0x46 &&
    head[8] === 0x41 &&
    head[9] === 0x56 &&
    head[10] === 0x49 &&
    head[11] === 0x20
  ) {
    return 'avi';
  }

  return null;
}

export interface ByteReader {
  /** Total bytes pulled from the underlying stream so far. */
  readonly total: number;
  /** Copy up to `n` bytes without consuming them. */
  peek(n: number): Promise<Uint8Array | null>;
  /** Consume up to `n` bytes (fewer at EOF). */
  readExact(n: number): Promise<Uint8Array | null>;
  /** Discard up to `n` bytes without buffering them; returns the count. */
  discardExact(n: number): Promise<number>;
  cancel(): Promise<void>;
}

/**
 * Wrap a web stream so structural parsing can read small headers and skip large
 * payloads without ever holding the whole object in memory.
 */
export function createByteReader(body: ReadableStream<Uint8Array>, maxBytes: number): ByteReader {
  const reader = body.getReader();
  const queue: Uint8Array[] = [];
  let queued = 0;
  let total = 0;
  let eof = false;

  async function pull(): Promise<void> {
    if (eof) {
      return;
    }

    const { done, value } = await reader.read();
    if (done) {
      eof = true;
      return;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      throw new VideoTooLargeError();
    }

    queue.push(value);
    queued += value.byteLength;
  }

  async function ensure(n: number): Promise<void> {
    while (queued < n && !eof) {
      await pull();
    }
  }

  function consume(out: Uint8Array): void {
    let offset = 0;
    while (offset < out.length) {
      const head = queue[0];
      const need = out.length - offset;

      if (head.byteLength <= need) {
        out.set(head, offset);
        offset += head.byteLength;
        queued -= head.byteLength;
        queue.shift();
      } else {
        out.set(head.subarray(0, need), offset);
        queue[0] = head.subarray(need);
        queued -= need;
        offset += need;
      }
    }
  }

  function drop(limit: number): number {
    let remaining = limit;
    while (remaining > 0 && queued > 0) {
      const head = queue[0];
      if (head.byteLength <= remaining) {
        remaining -= head.byteLength;
        queued -= head.byteLength;
        queue.shift();
      } else {
        queue[0] = head.subarray(remaining);
        queued -= remaining;
        remaining = 0;
      }
    }
    return limit - remaining;
  }

  return {
    get total() {
      return total;
    },

    async peek(n) {
      await ensure(n);
      const size = Math.min(n, queued);
      if (size === 0) {
        return null;
      }

      const out = new Uint8Array(size);
      let offset = 0;
      for (const chunk of queue) {
        if (offset >= size) {
          break;
        }
        const take = Math.min(chunk.byteLength, size - offset);
        out.set(chunk.subarray(0, take), offset);
        offset += take;
      }
      return out;
    },

    async readExact(n) {
      if (n <= 0) {
        return new Uint8Array(0);
      }

      await ensure(n);
      const size = Math.min(n, queued);
      if (size === 0) {
        return null;
      }

      const out = new Uint8Array(size);
      consume(out);
      return out;
    },

    async discardExact(n) {
      let remaining = n;

      for (;;) {
        remaining -= drop(remaining);
        if (remaining <= 0 || eof) {
          break;
        }
        await pull();
      }

      return n - remaining;
    },

    async cancel() {
      try {
        await reader.cancel();
      } catch {
        // Ignore cancellation errors.
      }
    },
  };
}

function readUint32BE(bytes: Uint8Array, offset: number): number | null {
  if (offset + 4 > bytes.length) {
    return null;
  }
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint64BE(bytes: Uint8Array, offset: number): number | null {
  const high = readUint32BE(bytes, offset);
  const low = readUint32BE(bytes, offset + 4);
  if (high === null || low === null) {
    return null;
  }
  return high * 0x100000000 + low;
}

function ascii4(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/**
 * Walk top-level ISOBMFF boxes and return the `moov` payload, skipping media
 * boxes without buffering them.
 */
export async function collectMp4Metadata(
  reader: ByteReader,
  maxMetadataBytes: number,
): Promise<Uint8Array | null> {
  for (let guard = 0; guard < 100_000; guard += 1) {
    const header = await reader.readExact(8);
    if (!header || header.length < 8) {
      return null;
    }

    let size = readUint32BE(header, 0);
    const type = ascii4(header, 4);
    let headerSize = 8;

    if (size === 1) {
      const extended = await reader.readExact(8);
      if (!extended || extended.length < 8) {
        return null;
      }
      size = readUint64BE(extended, 0);
      headerSize = 16;
    } else if (size === 0) {
      size = Number.POSITIVE_INFINITY;
    }

    if (size === null) {
      return null;
    }

    const payloadSize = size - headerSize;

    if (type === 'moov') {
      if (
        !Number.isFinite(payloadSize) ||
        payloadSize < 8 ||
        payloadSize > maxMetadataBytes
      ) {
        return null;
      }

      const moov = await reader.readExact(payloadSize);
      return moov && moov.length === payloadSize ? moov : null;
    }

    if (!Number.isFinite(payloadSize)) {
      return null;
    }

    const skipped = await reader.discardExact(payloadSize);
    if (skipped < payloadSize) {
      return null;
    }
  }

  return null;
}

interface StreamElement {
  id: number;
  size: number;
  unknown: boolean;
  headerLength: number;
}

/** Read a single EBML element header from the stream. */
async function readStreamElement(reader: ByteReader): Promise<StreamElement | null> {
  const idFirst = await reader.readExact(1);
  if (!idFirst || idFirst.length < 1) {
    return null;
  }

  let idLength = 1;
  let mask = 0x80;
  while ((idFirst[0] & mask) === 0) {
    mask >>= 1;
    idLength += 1;
    if (idLength > 8) {
      return null;
    }
  }

  let id = idFirst[0];
  if (idLength > 1) {
    const idRest = await reader.readExact(idLength - 1);
    if (!idRest || idRest.length < idLength - 1) {
      return null;
    }
    for (const byte of idRest) {
      id = id * 256 + byte;
    }
  }

  const sizeFirst = await reader.readExact(1);
  if (!sizeFirst || sizeFirst.length < 1) {
    return null;
  }

  let sizeLength = 1;
  let sizeMask = 0x80;
  while ((sizeFirst[0] & sizeMask) === 0) {
    sizeMask >>= 1;
    sizeLength += 1;
    if (sizeLength > 8) {
      return null;
    }
  }

  const sizeBytes = new Uint8Array(sizeLength);
  sizeBytes[0] = sizeFirst[0];
  if (sizeLength > 1) {
    const sizeRest = await reader.readExact(sizeLength - 1);
    if (!sizeRest || sizeRest.length < sizeLength - 1) {
      return null;
    }
    sizeBytes.set(sizeRest, 1);
  }

  const dataBits = sizeMask - 1;
  let unknown = (sizeBytes[0] & dataBits) === dataBits;
  let size = sizeBytes[0] & dataBits;
  for (let index = 1; index < sizeLength; index += 1) {
    size = size * 256 + sizeBytes[index];
    if (sizeBytes[index] !== 0xff) {
      unknown = false;
    }
  }

  return { id, size, unknown, headerLength: idLength + sizeLength };
}

const SEGMENT_ID = 0x18538067;
const INFO_ID = 0x1549a966;

/**
 * Walk the EBML stream and return the WebM `Info` element payload, discarding
 * clusters and other large elements without buffering them.
 */
export async function collectWebmMetadata(
  reader: ByteReader,
  maxMetadataBytes: number,
): Promise<Uint8Array | null> {
  let segment: StreamElement | null = null;

  for (let guard = 0; guard < 64; guard += 1) {
    const element = await readStreamElement(reader);
    if (!element) {
      return null;
    }

    if (element.id === SEGMENT_ID) {
      segment = element;
      break;
    }

    if (element.unknown) {
      return null;
    }

    const skipped = await reader.discardExact(element.size);
    if (skipped < element.size) {
      return null;
    }
  }

  if (!segment) {
    return null;
  }

  let remaining = segment.unknown ? Number.POSITIVE_INFINITY : segment.size;

  for (let guard = 0; guard < 1_000_000; guard += 1) {
    if (Number.isFinite(remaining) && remaining <= 0) {
      return null;
    }

    const element = await readStreamElement(reader);
    if (!element) {
      return null;
    }

    if (Number.isFinite(remaining)) {
      remaining -= element.headerLength;
    }

    if (element.id === INFO_ID) {
      if (element.unknown || element.size < 4 || element.size > maxMetadataBytes) {
        return null;
      }
      const info = await reader.readExact(element.size);
      return info && info.length === element.size ? info : null;
    }

    if (element.unknown) {
      return null;
    }

    const skipped = await reader.discardExact(element.size);
    if (skipped < element.size) {
      return null;
    }

    if (Number.isFinite(remaining)) {
      remaining -= skipped;
    }
  }

  return null;
}

function readUint32LE(bytes: Uint8Array, offset: number): number | null {
  if (offset + 4 > bytes.length) {
    return null;
  }
  return (
    bytes[offset] +
    (bytes[offset + 1] << 8) +
    (bytes[offset + 2] << 16) +
    bytes[offset + 3] * 0x1000000
  );
}

/** RIFF chunks are word-aligned; odd sizes carry one padding byte. */
function padEven(size: number): number {
  return size + (size % 2);
}

/**
 * Walk a RIFF/AVI file and return the `hdrl > avih` payload (the main AVI
 * header), discarding `movi` and other media chunks without buffering them.
 */
export async function collectAviMetadata(
  reader: ByteReader,
  maxMetadataBytes: number,
): Promise<Uint8Array | null> {
  const header = await reader.readExact(12);
  if (!header || header.length < 12) {
    return null;
  }

  if (ascii4(header, 0) !== 'RIFF' || ascii4(header, 8) !== 'AVI ') {
    return null;
  }

  for (let guard = 0; guard < 100_000; guard += 1) {
    const chunkHeader = await reader.readExact(8);
    if (!chunkHeader || chunkHeader.length < 8) {
      return null;
    }

    const id = ascii4(chunkHeader, 0);
    const size = readUint32LE(chunkHeader, 4);
    if (size === null) {
      return null;
    }

    if (id === 'LIST') {
      const listType = await reader.readExact(4);
      if (!listType || listType.length < 4) {
        return null;
      }

      if (ascii4(listType, 0) === 'hdrl') {
        return findAviHeader(reader, size - 4, maxMetadataBytes);
      }

      const skip = padEven(size - 4);
      if ((await reader.discardExact(skip)) < skip) {
        return null;
      }
      continue;
    }

    if (id === 'avih') {
      if (size < 20 || size > maxMetadataBytes) {
        return null;
      }
      const avih = await reader.readExact(size);
      return avih && avih.length === size ? avih : null;
    }

    const skip = padEven(size);
    if ((await reader.discardExact(skip)) < skip) {
      return null;
    }
  }

  return null;
}

async function findAviHeader(
  reader: ByteReader,
  hdrlSize: number,
  maxMetadataBytes: number,
): Promise<Uint8Array | null> {
  let remaining = hdrlSize;

  while (remaining >= 8) {
    const subHeader = await reader.readExact(8);
    if (!subHeader || subHeader.length < 8) {
      return null;
    }

    const id = ascii4(subHeader, 0);
    const size = readUint32LE(subHeader, 4);
    if (size === null) {
      return null;
    }

    if (id === 'avih') {
      if (size < 20 || size > maxMetadataBytes) {
        return null;
      }
      const avih = await reader.readExact(size);
      return avih && avih.length === size ? avih : null;
    }

    const skip = padEven(size);
    if ((await reader.discardExact(skip)) < skip) {
      return null;
    }
    remaining -= 8 + skip;
  }

  return null;
}
