import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MembershipFormValues } from '@/pages/public/membership/types';
import { GENERIC_MEMBERSHIP_ERROR, submitMembershipApplication } from './membershipService';

afterEach(() => {
  vi.unstubAllGlobals();
});

const VALUES: MembershipFormValues = {
  fullName: 'سعاد العلمي',
  phone: '0612345678',
  city: 'بني ملال',
  age: '22',
  gender: 'female',
  interests: ['ثقافية'],
  expectations: '',
};

function stubFetch(response: { ok: boolean; body: unknown }) {
  const fetchMock = vi.fn(async () => ({
    ok: response.ok,
    json: async () => response.body,
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('submitMembershipApplication', () => {
  it('sends the values together with the Turnstile token', async () => {
    const fetchMock = stubFetch({ ok: true, body: { ok: true } });

    await submitMembershipApplication(VALUES, 'turnstile-token');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/membership',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ...VALUES, turnstileToken: 'turnstile-token' }),
      }),
    );
  });

  it('throws the safe server message on failure', async () => {
    stubFetch({ ok: false, body: { message: 'تعذّر إرسال طلب الانخراط. المرجو المحاولة مرة أخرى.' } });

    await expect(submitMembershipApplication(VALUES, 'token')).rejects.toThrow(
      'تعذّر إرسال طلب الانخراط. المرجو المحاولة مرة أخرى.',
    );
  });

  it('falls back to the generic message when the body is not usable', async () => {
    stubFetch({ ok: false, body: {} });

    await expect(submitMembershipApplication(VALUES, 'token')).rejects.toThrow(
      GENERIC_MEMBERSHIP_ERROR,
    );
  });
});
