/**
 * Product validation — shared by the dashboard form and the admin API.
 *
 * Pure and dependency-free so it can be imported by both the browser bundle and
 * the Node serverless handlers (see the Golden Voice validation precedent).
 */

export interface AdditionalInfoItem {
  label: string;
  value: string;
}

/** Normalised product payload used by the create/update endpoints. */
export interface ProductInput {
  name: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  isAvailable: boolean;
  shortDescription: string | null;
  description: string | null;
  additionalInformation: AdditionalInfoItem[];
  tags: string[];
  imageUrl: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
}

/** Editable values of the dashboard product form (strings for text inputs). */
export interface ProductFormValues {
  name: string;
  category: string;
  price: string;
  compareAtPrice: string;
  isAvailable: boolean;
  shortDescription: string;
  description: string;
  additionalInformation: AdditionalInfoItem[];
  tags: string;
  imageUrl: string | null;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
}

export type ProductField =
  | 'name'
  | 'category'
  | 'price'
  | 'compareAtPrice'
  | 'shortDescription'
  | 'description'
  | 'tags'
  | 'additionalInformation'
  | 'imageUrl'
  | 'form';

export type ProductErrors = Partial<Record<ProductField, string>>;

export const MAX_NAME_LENGTH = 200;
export const MAX_CATEGORY_LENGTH = 80;
export const MAX_PRICE = 1_000_000;
export const MAX_SHORT_DESCRIPTION_LENGTH = 600;
export const MAX_DESCRIPTION_LENGTH = 20000;
export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;
export const MAX_ADDITIONAL_INFO = 20;
export const MAX_ADDITIONAL_LABEL_LENGTH = 80;
export const MAX_ADDITIONAL_VALUE_LENGTH = 200;
export const MAX_IMAGE_URL_LENGTH = 2048;

const INVALID_MESSAGE = 'المرجو التحقق من صحة البيانات المدخلة.';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function emptyProductForm(): ProductFormValues {
  return {
    name: '',
    category: '',
    price: '',
    compareAtPrice: '',
    isAvailable: true,
    shortDescription: '',
    description: '',
    additionalInformation: [],
    tags: '',
    imageUrl: null,
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
  };
}

/** Parse a non-negative monetary value (≤ 1,000,000) from a string or number. */
export function parsePrice(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? round2(raw) : null;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim().replace(',', '.');
    if (!trimmed) {
      return null;
    }
    const value = Number(trimmed);
    return Number.isFinite(value) && value >= 0 ? round2(value) : null;
  }
  return null;
}

/** Split, trim, de-duplicate and validate keywords. `null` means invalid. */
export function normalizeTags(raw: unknown): string[] | null {
  if (raw === undefined || raw === null) {
    return [];
  }

  let items: unknown[];
  if (typeof raw === 'string') {
    items = raw.split(/[,\n]/);
  } else if (Array.isArray(raw)) {
    items = raw;
  } else {
    return null;
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const tag = typeof item === 'string' ? item.trim().replace(/\s+/g, ' ') : '';
    if (!tag) {
      continue;
    }
    if (tag.length > MAX_TAG_LENGTH) {
      return null;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(tag);
  }

  return result.length > MAX_TAGS ? null : result;
}

/** Normalise the additional-information rows, dropping empty ones. */
export function normalizeAdditionalInformation(raw: unknown): AdditionalInfoItem[] | null {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    return null;
  }

  const result: AdditionalInfoItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    const record = entry as Record<string, unknown>;
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    const value = typeof record.value === 'string' ? record.value.trim() : '';
    if (!label && !value) {
      continue;
    }
    if (!label || !value) {
      return null;
    }
    if (
      label.length > MAX_ADDITIONAL_LABEL_LENGTH ||
      value.length > MAX_ADDITIONAL_VALUE_LENGTH
    ) {
      return null;
    }
    result.push({ label, value });
  }

  return result.length > MAX_ADDITIONAL_INFO ? null : result;
}

/** Field-level Arabic validation for a normalised payload. */
export function validateProductInput(input: ProductInput): ProductErrors {
  const errors: ProductErrors = {};

  if (!input.name) {
    errors.name = 'المرجو إدخال اسم المنتج.';
  } else if (input.name.length > MAX_NAME_LENGTH) {
    errors.name = 'اسم المنتج طويل جداً.';
  }

  if (!input.category) {
    errors.category = 'المرجو إدخال الفئة.';
  } else if (input.category.length > MAX_CATEGORY_LENGTH) {
    errors.category = 'اسم الفئة طويل جداً.';
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    errors.price = 'المرجو إدخال ثمن صحيح.';
  } else if (input.price > MAX_PRICE) {
    errors.price = 'الثمن كبير جداً.';
  }

  if (input.compareAtPrice !== null) {
    if (!Number.isFinite(input.compareAtPrice) || input.compareAtPrice < 0) {
      errors.compareAtPrice = 'الثمن القديم غير صالح.';
    } else if (input.compareAtPrice <= input.price) {
      errors.compareAtPrice = 'يجب أن يكون الثمن القديم أكبر من الثمن الحالي.';
    }
  }

  if (
    input.shortDescription &&
    input.shortDescription.length > MAX_SHORT_DESCRIPTION_LENGTH
  ) {
    errors.shortDescription = 'الوصف المختصر طويل جداً.';
  }

  if (input.description && input.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = 'الوصف المفصل طويل جداً.';
  }

  if (input.tags.length > MAX_TAGS) {
    errors.tags = 'عدد الكلمات المفتاحية كبير جداً.';
  }

  if (input.additionalInformation.length > MAX_ADDITIONAL_INFO) {
    errors.additionalInformation = 'عدد العناصر كبير جداً.';
  }

  if (input.imageUrl && input.imageUrl.length > MAX_IMAGE_URL_LENGTH) {
    errors.imageUrl = 'رابط الصورة غير صالح.';
  }

  return errors;
}

/** Convert dashboard form values into a normalised payload plus field errors. */
export function formToInput(values: ProductFormValues): {
  input: ProductInput;
  errors: ProductErrors;
} {
  const errors: ProductErrors = {};

  const price = parsePrice(values.price);
  if (price === null) {
    errors.price = 'المرجو إدخال ثمن صحيح.';
  }

  let compareAtPrice: number | null = null;
  if (values.compareAtPrice.trim() !== '') {
    compareAtPrice = parsePrice(values.compareAtPrice);
    if (compareAtPrice === null) {
      errors.compareAtPrice = 'الثمن القديم غير صالح.';
    }
  }

  const tags = normalizeTags(values.tags);
  if (tags === null) {
    errors.tags = 'الكلمات المفتاحية غير صالحة.';
  }

  const additionalInformation = normalizeAdditionalInformation(values.additionalInformation);
  if (additionalInformation === null) {
    errors.additionalInformation = 'المعلومات الإضافية غير صالحة.';
  }

  const description = values.description.replace(/\r\n/g, '\n').trim();

  const input: ProductInput = {
    name: values.name.trim(),
    category: values.category.trim(),
    price: price ?? Number.NaN,
    compareAtPrice,
    isAvailable: values.isAvailable,
    shortDescription: values.shortDescription.trim() || null,
    description: description || null,
    additionalInformation: additionalInformation ?? [],
    tags: tags ?? [],
    imageUrl: values.imageUrl,
    isFeatured: values.isFeatured,
    isBestSeller: values.isBestSeller,
    isNew: values.isNew,
  };

  return { input, errors: { ...validateProductInput(input), ...errors } };
}

/** Parse and validate a raw JSON body (server side). */
export function parseProductBody(body: unknown): {
  input: ProductInput | null;
  errors: ProductErrors;
} {
  if (!body || typeof body !== 'object') {
    return { input: null, errors: { form: INVALID_MESSAGE } };
  }

  const raw = body as Record<string, unknown>;
  const errors: ProductErrors = {};

  const price = parsePrice(raw.price);
  if (price === null) {
    errors.price = 'المرجو إدخال ثمن صحيح.';
  }

  let compareAtPrice: number | null = null;
  const rawCompare = raw.compareAtPrice;
  if (rawCompare !== null && rawCompare !== undefined && rawCompare !== '') {
    compareAtPrice = parsePrice(rawCompare);
    if (compareAtPrice === null) {
      errors.compareAtPrice = 'الثمن القديم غير صالح.';
    }
  }

  const tags = normalizeTags(raw.tags);
  if (tags === null) {
    errors.tags = 'الكلمات المفتاحية غير صالحة.';
  }

  const additionalInformation = normalizeAdditionalInformation(raw.additionalInformation);
  if (additionalInformation === null) {
    errors.additionalInformation = 'المعلومات الإضافية غير صالحة.';
  }

  const shortDescription =
    typeof raw.shortDescription === 'string' ? raw.shortDescription.trim() : '';
  const description =
    typeof raw.description === 'string' ? raw.description.replace(/\r\n/g, '\n').trim() : '';

  const input: ProductInput = {
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    category: typeof raw.category === 'string' ? raw.category.trim() : '',
    price: price ?? Number.NaN,
    compareAtPrice,
    isAvailable: raw.isAvailable !== false,
    shortDescription: shortDescription || null,
    description: description || null,
    additionalInformation: additionalInformation ?? [],
    tags: tags ?? [],
    imageUrl:
      typeof raw.imageUrl === 'string' && raw.imageUrl.trim() ? raw.imageUrl.trim() : null,
    isFeatured: raw.isFeatured === true,
    isBestSeller: raw.isBestSeller === true,
    isNew: raw.isNew === true,
  };

  return { input, errors: { ...validateProductInput(input), ...errors } };
}

/** True when there are no field errors. */
export function isProductValid(errors: ProductErrors): boolean {
  return Object.keys(errors).length === 0;
}
