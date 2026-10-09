import type { RegionValue } from './constants.js';

/** Editable values of the Golden Voice registration form. */
export interface RegistrationValues {
  fullName: string;
  phone: string;
  age: string;
  city: string;
  /** Empty string means the participant has not chosen a region yet. */
  region: RegionValue | '';
}

export type RegistrationFieldName = keyof RegistrationValues;

/** Error messages keyed by field, plus the conditional video field. */
export type RegistrationErrors = Partial<Record<RegistrationFieldName | 'video', string>>;

/**
 * A locally selected video.
 *
 * `durationSeconds` is the browser's best-effort read of the metadata; it is
 * `null` when the browser cannot decode the container/codec (for example AVI or
 * MKV on some devices). The server always re-validates the real duration, so an
 * unknown client value does not block submission.
 */
export interface SelectedVideo {
  file: File;
  durationSeconds: number | null;
}
