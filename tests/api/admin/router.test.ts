import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerResponse } from 'node:http';

const mocks = vi.hoisted(() => {
  const make = () =>
    vi.fn((_req: unknown, res: { statusCode: number }) => {
      res.statusCode = 200;
    });
  return {
    competitions: make(),
    contactRequests: make(),
    me: make(),
    members: make(),
    participantVideo: make(),
    participants: make(),
    productImageUploads: make(),
    products: make(),
  };
});

vi.mock('../../../api/admin/_competitions.js', () => ({ default: mocks.competitions }));
vi.mock('../../../api/admin/_contact-requests.js', () => ({ default: mocks.contactRequests }));
vi.mock('../../../api/admin/_me.js', () => ({ default: mocks.me }));
vi.mock('../../../api/admin/_members.js', () => ({ default: mocks.members }));
vi.mock('../../../api/admin/_participant-video.js', () => ({ default: mocks.participantVideo }));
vi.mock('../../../api/admin/_participants.js', () => ({ default: mocks.participants }));
vi.mock('../../../api/admin/_product-image-uploads.js', () => ({
  default: mocks.productImageUploads,
}));
vi.mock('../../../api/admin/_products.js', () => ({ default: mocks.products }));

import handler from '../../../api/admin/[route].js';

function createResponse() {
  const res = {
    statusCode: 0,
    setHeader(_name: string, _value: unknown) {},
    end(_chunk?: string) {},
  };

  return {
    res: res as unknown as ServerResponse,
    get status() {
      return res.statusCode;
    },
  };
}

const CASES = [
  ['competitions', mocks.competitions],
  ['contact-requests', mocks.contactRequests],
  ['me', mocks.me],
  ['members', mocks.members],
  ['participant-video', mocks.participantVideo],
  ['participants', mocks.participants],
  ['product-image-uploads', mocks.productImageUploads],
  ['products', mocks.products],
] as const;

beforeEach(() => {
  for (const [, fn] of CASES) {
    fn.mockClear();
  }
});

describe('GET /api/admin/[route] dispatch', () => {
  for (const [route, fn] of CASES) {
    it(`routes "${route}" to its handler`, async () => {
      const fake = createResponse();
      await handler({ method: 'GET', headers: {}, query: { route } } as never, fake.res);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fake.status).toBe(200);
    });
  }

  it('returns 404 for an unknown route and never calls a handler', async () => {
    const fake = createResponse();
    await handler({ method: 'GET', headers: {}, query: { route: 'nope' } } as never, fake.res);

    expect(fake.status).toBe(404);
    for (const [, fn] of CASES) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it('falls back to the URL path when the query helper is absent', async () => {
    const fake = createResponse();
    await handler(
      { method: 'GET', headers: {}, url: '/api/admin/members?q=abc' } as never,
      fake.res,
    );

    expect(mocks.members).toHaveBeenCalledTimes(1);
    expect(fake.status).toBe(200);
  });
});
