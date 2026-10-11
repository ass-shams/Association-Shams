import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminApiError } from '../services/adminApi';
import { createProduct, updateProduct, uploadProductImage } from '../services/productsService';
import type { AdminProduct } from '../services/productsService';
import {
  emptyProductForm,
  formToInput,
  isProductValid,
  MAX_ADDITIONAL_INFO,
  MAX_NAME_LENGTH,
  MAX_PRICE,
  MAX_SHORT_DESCRIPTION_LENGTH,
} from '@/data/productValidation';
import type { ProductErrors, ProductFormValues } from '@/data/productValidation';

export interface ProductFormProps {
  /** Existing product when editing, or `null` when creating. */
  readonly initial: AdminProduct | null;
  /** Known categories offered as suggestions. */
  readonly categories: readonly string[];
  readonly onCancel: () => void;
  readonly onSaved: (product: AdminProduct) => void;
}

const FALLBACK_SAVE_ERROR = 'تعذّر حفظ المنتج. المرجو المحاولة مرة أخرى.';

function productToForm(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    price: String(product.price),
    compareAtPrice: product.compareAtPrice !== null ? String(product.compareAtPrice) : '',
    isAvailable: product.isAvailable,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    additionalInformation: product.additionalInformation.map((item) => ({ ...item })),
    tags: product.tags.join(', '),
    imageUrl: product.imageUrl,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isNew: product.isNew,
  };
}

/** Create/edit product form shown in a modal from the Store page. */
export default function ProductForm({ initial, categories, onCancel, onSaved }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() =>
    initial ? productToForm(initial) : emptyProductForm(),
  );
  const [errors, setErrors] = useState<ProductErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key as keyof ProductErrors] ? { ...current, [key]: undefined } : current));
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    setImageError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const publicUrl = await uploadProductImage(file);
      setField('imageUrl', publicUrl);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(publicUrl);
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(values.imageUrl);
      setImageError(error instanceof Error ? error.message : 'تعذّر رفع الصورة.');
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setImageError(null);
    setField('imageUrl', null);
    setPreviewUrl(null);
  }

  function updateInfo(index: number, field: 'label' | 'value', value: string) {
    setValues((current) => ({
      ...current,
      additionalInformation: current.additionalInformation.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addInfo() {
    setValues((current) => ({
      ...current,
      additionalInformation: [...current.additionalInformation, { label: '', value: '' }],
    }));
  }

  function removeInfo(index: number) {
    setValues((current) => ({
      ...current,
      additionalInformation: current.additionalInformation.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || uploading) {
      return;
    }

    const { input, errors: nextErrors } = formToInput(values);
    setErrors(nextErrors);
    setSaveError(null);

    if (!isProductValid(nextErrors)) {
      return;
    }

    setSaving(true);
    try {
      const saved = initial ? await updateProduct(initial.id, input) : await createProduct(input);
      onSaved(saved);
    } catch (error) {
      setSaveError(error instanceof AdminApiError ? error.message : FALLBACK_SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dash-store__modal" role="dialog" aria-modal="true" aria-label={initial ? 'تعديل المنتج' : 'إضافة منتج'}>
      <button
        type="button"
        className="dash-store__modal-backdrop"
        aria-label="إغلاق"
        onClick={onCancel}
      />

      <form className="dash-store__modal-panel" onSubmit={handleSubmit} noValidate>
        <div className="dash-store__modal-head">
          <h3 className="dash-store__modal-title">{initial ? 'تعديل المنتج' : 'إضافة منتج'}</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
            <span className="btn__label">إغلاق</span>
          </button>
        </div>

        {saveError ? (
          <p className="form-alert" role="alert">
            {saveError}
          </p>
        ) : null}

        <div className="dash-store__field">
          <label className="field__label" htmlFor="product-name">
            اسم المنتج <span className="field__required" aria-hidden="true">*</span>
          </label>
          <input
            id="product-name"
            className="input"
            type="text"
            value={values.name}
            maxLength={MAX_NAME_LENGTH}
            disabled={saving}
            onChange={(event) => setField('name', event.target.value)}
          />
          {errors.name ? <p className="field__message field__error">{errors.name}</p> : null}
        </div>

        <div className="dash-store__field">
          <span className="field__label">صورة المنتج</span>
          <div className="dash-store__image">
            {previewUrl ? (
              <img className="dash-store__image-preview" src={previewUrl} alt="معاينة صورة المنتج" />
            ) : (
              <span className="dash-store__image-empty">لا توجد صورة</span>
            )}
            <div className="dash-store__image-actions">
              <label className="btn btn--outline btn--sm">
                <span className="btn__label">{uploading ? 'جارٍ الرفع…' : 'اختيار صورة'}</span>
                <input
                  ref={fileRef}
                  className="dash-store__file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={saving || uploading}
                  onChange={(event) => void handleImageChange(event)}
                />
              </label>
              {previewUrl ? (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={saving || uploading}
                  onClick={removeImage}
                >
                  <span className="btn__label">إزالة الصورة</span>
                </button>
              ) : null}
            </div>
          </div>
          <p className="dash-store__hint">JPG أو PNG أو WEBP أو GIF، بحجم أقصاه 5 ميغابايت.</p>
          {imageError ? <p className="field__message field__error">{imageError}</p> : null}
        </div>

        <div className="dash-store__row">
          <div className="dash-store__field">
            <label className="field__label" htmlFor="product-price">
              الثمن الحالي (درهم) <span className="field__required" aria-hidden="true">*</span>
            </label>
            <input
              id="product-price"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_PRICE}
              step="0.01"
              value={values.price}
              disabled={saving}
              onChange={(event) => setField('price', event.target.value)}
            />
            {errors.price ? <p className="field__message field__error">{errors.price}</p> : null}
          </div>

          <div className="dash-store__field">
            <label className="field__label" htmlFor="product-compare">
              الثمن القديم (اختياري)
            </label>
            <input
              id="product-compare"
              className="input"
              type="number"
              inputMode="decimal"
              min={0}
              max={MAX_PRICE}
              step="0.01"
              value={values.compareAtPrice}
              disabled={saving}
              onChange={(event) => setField('compareAtPrice', event.target.value)}
            />
            {errors.compareAtPrice ? (
              <p className="field__message field__error">{errors.compareAtPrice}</p>
            ) : (
              <p className="dash-store__hint">اتركه فارغاً إن لم يكن هناك تخفيض.</p>
            )}
          </div>
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="product-category">
            الفئة <span className="field__required" aria-hidden="true">*</span>
          </label>
          <input
            id="product-category"
            className="input"
            type="text"
            list="product-categories"
            value={values.category}
            disabled={saving}
            onChange={(event) => setField('category', event.target.value)}
          />
          <datalist id="product-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          {errors.category ? <p className="field__message field__error">{errors.category}</p> : null}
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="product-tags">
            الكلمات المفتاحية (اختياري)
          </label>
          <input
            id="product-tags"
            className="input"
            type="text"
            value={values.tags}
            disabled={saving}
            onChange={(event) => setField('tags', event.target.value)}
          />
          <p className="dash-store__hint">افصل بين الكلمات بفاصلة.</p>
          {errors.tags ? <p className="field__message field__error">{errors.tags}</p> : null}
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="product-short">
            وصف مختصر
          </label>
          <textarea
            id="product-short"
            className="input textarea"
            rows={2}
            maxLength={MAX_SHORT_DESCRIPTION_LENGTH}
            value={values.shortDescription}
            disabled={saving}
            onChange={(event) => setField('shortDescription', event.target.value)}
          />
          {errors.shortDescription ? (
            <p className="field__message field__error">{errors.shortDescription}</p>
          ) : null}
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="product-description">
            وصف مفصل للمنتج
          </label>
          <textarea
            id="product-description"
            className="input textarea"
            rows={5}
            value={values.description}
            disabled={saving}
            onChange={(event) => setField('description', event.target.value)}
          />
          <p className="dash-store__hint">تُحفظ أسطر النص كما هي.</p>
          {errors.description ? (
            <p className="field__message field__error">{errors.description}</p>
          ) : null}
        </div>

        <div className="dash-store__field">
          <span className="field__label">معلومات إضافية (اختياري)</span>
          {values.additionalInformation.length > 0 ? (
            <div className="dash-store__info-list">
              {values.additionalInformation.map((item, index) => (
                <div className="dash-store__info-row" key={index}>
                  <input
                    className="input"
                    type="text"
                    placeholder="العنوان"
                    value={item.label}
                    disabled={saving}
                    aria-label={`عنوان المعلومة ${index + 1}`}
                    onChange={(event) => updateInfo(index, 'label', event.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="القيمة"
                    value={item.value}
                    disabled={saving}
                    aria-label={`قيمة المعلومة ${index + 1}`}
                    onChange={(event) => updateInfo(index, 'value', event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={saving}
                    onClick={() => removeInfo(index)}
                  >
                    <span className="btn__label">حذف</span>
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            className="btn btn--outline btn--sm"
            disabled={saving || values.additionalInformation.length >= MAX_ADDITIONAL_INFO}
            onClick={addInfo}
          >
            <span className="btn__label">إضافة عنصر</span>
          </button>
          {errors.additionalInformation ? (
            <p className="field__message field__error">{errors.additionalInformation}</p>
          ) : null}
        </div>

        <div className="dash-store__toggles">
          <label className="dash-store__toggle">
            <input
              type="checkbox"
              checked={values.isAvailable}
              disabled={saving}
              onChange={(event) => setField('isAvailable', event.target.checked)}
            />
            <span>المنتج متوفر</span>
          </label>
          <label className="dash-store__toggle">
            <input
              type="checkbox"
              checked={values.isFeatured}
              disabled={saving}
              onChange={(event) => setField('isFeatured', event.target.checked)}
            />
            <span>منتج مميز</span>
          </label>
          <label className="dash-store__toggle">
            <input
              type="checkbox"
              checked={values.isBestSeller}
              disabled={saving}
              onChange={(event) => setField('isBestSeller', event.target.checked)}
            />
            <span>الأكثر مبيعاً</span>
          </label>
          <label className="dash-store__toggle">
            <input
              type="checkbox"
              checked={values.isNew}
              disabled={saving}
              onChange={(event) => setField('isNew', event.target.checked)}
            />
            <span>منتج جديد</span>
          </label>
        </div>

        <div className="dash-store__modal-actions">
          <button type="submit" className="btn btn--primary btn--md" disabled={saving || uploading}>
            {saving ? <span className="btn__spinner" aria-hidden="true" /> : null}
            <span className="btn__label">{saving ? 'جارٍ الحفظ…' : 'حفظ'}</span>
          </button>
          <button type="button" className="btn btn--outline btn--md" disabled={saving} onClick={onCancel}>
            <span className="btn__label">إلغاء</span>
          </button>
        </div>
      </form>
    </div>
  );
}
