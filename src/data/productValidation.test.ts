import { describe, expect, it } from 'vitest';
import {
  emptyProductForm,
  formToInput,
  normalizeAdditionalInformation,
  normalizeTags,
  parsePrice,
  parseProductBody,
  validateProductInput,
} from './productValidation';
import type { ProductInput } from './productValidation';

function baseInput(overrides: Partial<ProductInput> = {}): ProductInput {
  return {
    name: 'قميص الجمعية',
    category: 'ملابس',
    price: 150,
    compareAtPrice: 190,
    isAvailable: true,
    shortDescription: 'قميص قطني مريح.',
    description: 'وصف مفصل.',
    additionalInformation: [{ label: 'المادة', value: 'قطن' }],
    tags: ['قميص'],
    imageUrl: null,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    ...overrides,
  };
}

describe('parsePrice', () => {
  it('accepts non-negative numbers and numeric strings', () => {
    expect(parsePrice('150')).toBe(150);
    expect(parsePrice('150.5')).toBe(150.5);
    expect(parsePrice(150)).toBe(150);
    expect(parsePrice('0')).toBe(0);
  });

  it('rejects invalid values', () => {
    expect(parsePrice('-1')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
    expect(parsePrice('')).toBeNull();
    expect(parsePrice(Number.NaN)).toBeNull();
  });
});

describe('normalizeTags', () => {
  it('splits, trims and de-duplicates keywords', () => {
    expect(normalizeTags('قميص, هدية ,قميص')).toEqual(['قميص', 'هدية']);
    expect(normalizeTags(['a', ' b ', 'a'])).toEqual(['a', 'b']);
  });

  it('rejects an over-long tag list', () => {
    expect(normalizeTags(Array.from({ length: 21 }, (_, i) => `tag-${i}`))).toBeNull();
  });
});

describe('normalizeAdditionalInformation', () => {
  it('drops empty rows and trims the rest', () => {
    expect(
      normalizeAdditionalInformation([
        { label: ' المادة ', value: ' قطن ' },
        { label: '', value: '' },
      ]),
    ).toEqual([{ label: 'المادة', value: 'قطن' }]);
  });

  it('rejects malformed rows', () => {
    expect(normalizeAdditionalInformation([{ label: 'x' }])).toBeNull();
    expect(normalizeAdditionalInformation('nope')).toBeNull();
  });
});

describe('validateProductInput', () => {
  it('accepts a complete product', () => {
    expect(validateProductInput(baseInput())).toEqual({});
  });

  it('requires a name, category and valid price', () => {
    const errors = validateProductInput(
      baseInput({ name: '', category: '', price: Number.NaN }),
    );
    expect(errors.name).toBeDefined();
    expect(errors.category).toBeDefined();
    expect(errors.price).toBeDefined();
  });

  it('rejects a previous price that is not a real discount', () => {
    expect(validateProductInput(baseInput({ price: 100, compareAtPrice: 100 })).compareAtPrice).toBeDefined();
    expect(validateProductInput(baseInput({ price: 100, compareAtPrice: 80 })).compareAtPrice).toBeDefined();
  });
});

describe('formToInput', () => {
  it('converts a valid form into a payload', () => {
    const { input, errors } = formToInput({
      ...emptyProductForm(),
      name: '  كوب شمس  ',
      category: 'هدايا',
      price: '60',
      compareAtPrice: '75',
      tags: 'كوب, هدية',
    });

    expect(errors).toEqual({});
    expect(input.name).toBe('كوب شمس');
    expect(input.price).toBe(60);
    expect(input.compareAtPrice).toBe(75);
    expect(input.tags).toEqual(['كوب', 'هدية']);
  });

  it('reports an invalid price and a non-discount previous price', () => {
    const { errors } = formToInput({
      ...emptyProductForm(),
      name: 'منتج',
      category: 'فئة',
      price: '100',
      compareAtPrice: '50',
    });
    expect(errors.compareAtPrice).toBeDefined();
  });
});

describe('parseProductBody', () => {
  it('parses a raw JSON body', () => {
    const { input, errors } = parseProductBody({
      name: 'منتج',
      category: 'فئة',
      price: '10',
      tags: ['a', 'b'],
    });
    expect(errors).toEqual({});
    expect(input?.price).toBe(10);
    expect(input?.isAvailable).toBe(true);
  });

  it('rejects a non-object body', () => {
    expect(parseProductBody(null).input).toBeNull();
    expect(parseProductBody('x').errors.form).toBeDefined();
  });
});
