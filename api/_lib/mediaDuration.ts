/**
 * Minimal, dependency-free media duration extraction for the two accepted
 * containers (MP4 / ISOBMFF and WebM / Matroska).
 *
 * The serverless runtime has no FFmpeg binary, so duration is read directly
 * from the container metadata rather than trusting the browser. These parsers
 * only read declared structural values and never decode media.
 */

/** Resolve a duration in seconds for the given container, or null if unknown. */
export function extractDurationSeconds(
  bytes: Uint8Array,
  container: 'mp4' | 'webm',
): number | null {
  return container === 'webm' ? getWebmDurationSeconds(bytes) : getMp4DurationSeconds(bytes);
}

function readUint32(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) {
    return null;
  }

  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function readUint64(bytes: Uint8Array, offset: number): number | null {
  const high = readUint32(bytes, offset);
  const low = readUint32(bytes, offset + 4);
  if (high === null || low === null) {
    return null;
  }
  return high * 0x100000000 + low;
}

function readBoxType(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

/** Read an ISOBMFF box header, supporting the 64-bit extended size form. */
function readBoxHeader(
  bytes: Uint8Array,
  offset: number,
  limit: number,
): { type: string; headerSize: number; size: number } | null {
  if (offset + 8 > limit || offset + 8 > bytes.length) {
    return null;
  }

  const type = readBoxType(bytes, offset + 4);
  let size = readUint32(bytes, offset);
  if (size === null) {
    return null;
  }
  let headerSize = 8;

  if (size === 1) {
    const extended = readUint64(bytes, offset + 8);
    if (extended === null) {
      return null;
    }
    size = extended;
    headerSize = 16;
  } else if (size === 0) {
    size = limit - offset;
  }

  if (size < headerSize) {
    return null;
  }

  return { type, headerSize, size };
}

/** Duration from an MP4/MOV `moov > mvhd` box, in seconds. */
export function getMp4DurationSeconds(bytes: Uint8Array): number | null {
  let offset = 0;

  while (offset + 8 <= bytes.length) {
    const header = readBoxHeader(bytes, offset, bytes.length);
    if (!header) {
      return null;
    }

    if (header.type === 'moov') {
      const end = Math.min(offset + header.size, bytes.length);
      return getMp4DurationFromMoov(bytes.subarray(offset + header.headerSize, end));
    }

    offset += header.size;
  }

  return null;
}

/**
 * Duration from an already-extracted `moov` box payload, in seconds.
 * Used by the streaming collector so only metadata (never media) is buffered.
 */
export function getMp4DurationFromMoov(moov: Uint8Array): number | null {
  return findMvhdDuration(moov, 0, moov.length);
}

function findMvhdDuration(bytes: Uint8Array, start: number, end: number): number | null {
  const limit = Math.min(end, bytes.length);
  let offset = start;

  while (offset + 8 <= limit) {
    const header = readBoxHeader(bytes, offset, limit);
    if (!header) {
      return null;
    }

    if (header.type === 'mvhd') {
      return readMvhdDuration(bytes, offset + header.headerSize);
    }

    offset += header.size;
  }

  return null;
}

function readMvhdDuration(bytes: Uint8Array, payload: number): number | null {
  const version = bytes[payload];
  let timescale: number | null;
  let duration: number | null;

  if (version === 1) {
    timescale = readUint32(bytes, payload + 20);
    duration = readUint64(bytes, payload + 24);
  } else {
    timescale = readUint32(bytes, payload + 12);
    duration = readUint32(bytes, payload + 16);
  }

  if (timescale === null || duration === null || timescale <= 0 || duration <= 0) {
    return null;
  }

  const seconds = duration / timescale;
  return Number.isFinite(seconds) ? seconds : null;
}

interface EbmlVint {
  value: number;
  length: number;
  unknown: boolean;
}

/** Read an EBML variable-length ID (marker bit preserved). */
function readEbmlId(bytes: Uint8Array, offset: number): EbmlVint | null {
  const first = bytes[offset];
  if (first === undefined) {
    return null;
  }

  let length = 1;
  let mask = 0x80;
  while ((first & mask) === 0) {
    mask >>= 1;
    length += 1;
    if (length > 8) {
      return null;
    }
  }

  if (offset + length > bytes.length) {
    return null;
  }

  let value = 0;
  for (let index = 0; index < length; index += 1) {
    value = value * 256 + bytes[offset + index];
  }

  return { value, length, unknown: false };
}

/** Read an EBML variable-length size (marker bit removed). */
function readEbmlSize(bytes: Uint8Array, offset: number): EbmlVint | null {
  const first = bytes[offset];
  if (first === undefined) {
    return null;
  }

  let length = 1;
  let mask = 0x80;
  while ((first & mask) === 0) {
    mask >>= 1;
    length += 1;
    if (length > 8) {
      return null;
    }
  }

  if (offset + length > bytes.length) {
    return null;
  }

  const dataBits = mask - 1;
  let unknown = (first & dataBits) === dataBits;
  let value = first & dataBits;

  for (let index = 1; index < length; index += 1) {
    const byte = bytes[offset + index];
    value = value * 256 + byte;
    if (byte !== 0xff) {
      unknown = false;
    }
  }

  return { value, length, unknown };
}

interface EbmlElement {
  id: number;
  size: number;
  dataStart: number;
  unknown: boolean;
}

function readEbmlElement(bytes: Uint8Array, offset: number): EbmlElement | null {
  const id = readEbmlId(bytes, offset);
  if (!id) {
    return null;
  }

  const size = readEbmlSize(bytes, offset + id.length);
  if (!size) {
    return null;
  }

  return {
    id: id.value,
    size: size.value,
    dataStart: offset + id.length + size.length,
    unknown: size.unknown,
  };
}

/** Find a direct child element by ID within a byte range. */
function findChildElement(
  bytes: Uint8Array,
  start: number,
  end: number,
  wantedId: number,
): EbmlElement | null {
  const limit = Math.min(end, bytes.length);
  let offset = start;

  while (offset < limit) {
    const element = readEbmlElement(bytes, offset);
    if (!element) {
      return null;
    }

    if (element.id === wantedId) {
      return element;
    }

    if (element.unknown) {
      return null;
    }

    offset = element.dataStart + element.size;
  }

  return null;
}

function readUnsignedBigEndian(bytes: Uint8Array, offset: number, size: number): number {
  let value = 0;
  for (let index = 0; index < size; index += 1) {
    value = value * 256 + (bytes[offset + index] ?? 0);
  }
  return value;
}

function readFloat(bytes: Uint8Array, offset: number, size: number): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, size);
  if (size === 4) {
    return view.getFloat32(0);
  }
  if (size === 8) {
    return view.getFloat64(0);
  }
  return size > 0 && size <= 8 ? readUnsignedBigEndian(bytes, offset, size) : null;
}

/** Duration from a WebM/Matroska `Segment > Info` element, in seconds. */
export function getWebmDurationSeconds(bytes: Uint8Array): number | null {
  const SEGMENT_ID = 0x18538067;
  const INFO_ID = 0x1549a966;

  const segment = findChildElement(bytes, 0, bytes.length, SEGMENT_ID);
  if (!segment) {
    return null;
  }

  const segmentEnd = segment.unknown ? bytes.length : segment.dataStart + segment.size;
  const info = findChildElement(bytes, segment.dataStart, segmentEnd, INFO_ID);
  if (!info) {
    return null;
  }

  const infoEnd = Math.min(info.dataStart + info.size, bytes.length);
  return getWebmDurationFromInfo(bytes.subarray(info.dataStart, infoEnd));
}

/**
 * Duration from an already-extracted WebM `Info` element payload, in seconds.
 * Used by the streaming collector so only metadata (never clusters) is buffered.
 */
export function getWebmDurationFromInfo(info: Uint8Array): number | null {
  const TIMECODE_SCALE_ID = 0x2ad7b1;
  const DURATION_ID = 0x4489;

  const durationElement = findChildElement(info, 0, info.length, DURATION_ID);
  if (!durationElement) {
    return null;
  }

  const timecodeElement = findChildElement(info, 0, info.length, TIMECODE_SCALE_ID);
  const timecodeScale = timecodeElement
    ? readUnsignedBigEndian(info, timecodeElement.dataStart, timecodeElement.size)
    : 1_000_000;

  if (durationElement.dataStart + durationElement.size > info.length) {
    return null;
  }

  const durationValue = readFloat(info, durationElement.dataStart, durationElement.size);

  if (durationValue === null || timecodeScale <= 0) {
    return null;
  }

  const seconds = (durationValue * timecodeScale) / 1e9;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
