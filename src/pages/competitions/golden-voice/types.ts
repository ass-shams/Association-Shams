import type { RegionValue } from './constants';

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

/** A locally selected video that passed metadata inspection. */
export interface SelectedVideo {
  file: File;
  durationSeconds: number;
}
