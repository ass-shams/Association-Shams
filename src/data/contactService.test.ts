import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitContactMessage } from './contactService';

const MESSAGE = {
  name: 'زائر',
  email: 'visitor@example.com',
  phone: '',
  subject: '',
  message: 'مرحباً',
};

function fakeResponse(status: number, body: unknown, jsonThrows = false) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (jsonThrows) {
        throw new Error('not json');
      }
      return body;
    },
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('submitContactMessage', () => {
  it('posts the values and Turnstile token to /api/contact', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => fakeResponse(201, { ok: true }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await submitContactMessage(MESSAGE, 'turnstile-token');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({ ...MESSAGE, turnstileToken: 'turnstile-token' });
  });

  it('rejects with the server message on a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => fakeResponse(400, { message: 'رسالة خطأ من الخادم' })),
    );

    await expect(submitContactMessage(MESSAGE, 'token')).rejects.toThrow('رسالة خطأ من الخادم');
  });

  it('rejects with a generic message on a non-JSON failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => fakeResponse(500, null, true)));

    await expect(submitContactMessage(MESSAGE, 'token')).rejects.toThrow(
      'تعذّر إرسال الرسالة. المرجو المحاولة مرة أخرى.',
    );
  });
});
