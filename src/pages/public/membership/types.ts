/**
 * Membership domain types.
 *
 * The membership experience lives entirely on the existing `/membership`
 * route and switches between three internal views held in local state:
 * the landing, the documents guide and the electronic form. Nothing here
 * talks to a backend — the form is a frontend-only preview.
 */

/** The three internal views of `/membership` (no new public routes). */
export type MembershipView = 'landing' | 'documents' | 'form';

export type Gender = 'male' | 'female';

/** The exact interest options approved for the membership form. */
export type InterestValue = 'ثقافية' | 'فنية' | 'رياضية' | 'ترفيهية' | 'تربوية';

export interface MembershipFormValues {
  fullName: string;
  phone: string;
  city: string;
  age: string;
  gender: Gender | '';
  interests: InterestValue[];
  expectations: string;
}

export interface MembershipFormErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  age?: string;
  gender?: string;
  interests?: string;
}
