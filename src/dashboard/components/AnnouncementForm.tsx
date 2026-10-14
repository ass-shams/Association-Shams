import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AdminApiError } from '../services/adminApi';
import {
  createAnnouncement,
  updateAnnouncement,
  uploadAnnouncementImage,
} from '../services/announcementsService';
import type { AdminAnnouncement } from '../services/announcementsService';
import {
  defaultPublishedAtInput,
  emptyAnnouncementForm,
  formToAnnouncementInput,
  isAnnouncementValid,
  MAX_BODY_LENGTH,
  MAX_TITLE_LENGTH,
} from '@/data/announcementValidation';
import type {
  AnnouncementErrors,
  AnnouncementFormValues,
  AnnouncementStatus,
} from '@/data/announcementValidation';

export interface AnnouncementFormProps {
  /** Existing announcement when editing, or `null` when creating. */
  readonly initial: AdminAnnouncement | null;
  readonly onCancel: () => void;
  readonly onSaved: (announcement: AdminAnnouncement, status: AnnouncementStatus) => void;
}

const FALLBACK_SAVE_ERROR = 'تعذّر حفظ الإعلان. المرجو المحاولة مرة أخرى.';

/** Convert an ISO timestamp into a `datetime-local` input value. */
function toLocalInput(iso: string | null): string {
  if (!iso) {
    return defaultPublishedAtInput();
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return defaultPublishedAtInput();
  }
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function announcementToForm(announcement: AdminAnnouncement): AnnouncementFormValues {
  return {
    title: announcement.title,
    body: announcement.body,
    imageUrl: announcement.imageUrl,
    publishedAt: toLocalInput(announcement.publishedAt),
  };
}

/** Create/edit announcement form shown in a modal from the Announcements page. */
export default function AnnouncementForm({ initial, onCancel, onSaved }: AnnouncementFormProps) {
  const [values, setValues] = useState<AnnouncementFormValues>(() =>
    initial ? announcementToForm(initial) : emptyAnnouncementForm(),
  );
  const [errors, setErrors] = useState<AnnouncementErrors>({});
  const [saving, setSaving] = useState(false);
  const [pendingAction, setPendingAction] = useState<AnnouncementStatus | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  function setField<K extends keyof AnnouncementFormValues>(
    key: K,
    value: AnnouncementFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) =>
      current[key as keyof AnnouncementErrors] ? { ...current, [key]: undefined } : current,
    );
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
      const publicUrl = await uploadAnnouncementImage(file);
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

  async function submit(status: AnnouncementStatus) {
    if (saving || uploading) {
      return;
    }

    const { input, errors: nextErrors } = formToAnnouncementInput(values, status);
    setErrors(nextErrors);
    setSaveError(null);

    if (!isAnnouncementValid(nextErrors)) {
      return;
    }

    setSaving(true);
    setPendingAction(status);
    try {
      const saved = initial
        ? await updateAnnouncement(initial.id, input)
        : await createAnnouncement(input);
      onSaved(saved, status);
    } catch (error) {
      setSaveError(error instanceof AdminApiError ? error.message : FALLBACK_SAVE_ERROR);
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div
      className="dash-store__modal"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'تعديل الإعلان' : 'إضافة إعلان'}
    >
      <button
        type="button"
        className="dash-store__modal-backdrop"
        aria-label="إغلاق"
        onClick={onCancel}
      />

      <form className="dash-store__modal-panel" onSubmit={handleSubmit} noValidate>
        <div className="dash-store__modal-head">
          <h3 className="dash-store__modal-title">{initial ? 'تعديل الإعلان' : 'إضافة إعلان'}</h3>
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
          <label className="field__label" htmlFor="announcement-title">
            عنوان الإعلان <span className="field__required" aria-hidden="true">*</span>
          </label>
          <input
            id="announcement-title"
            className="input"
            type="text"
            value={values.title}
            maxLength={MAX_TITLE_LENGTH}
            disabled={saving}
            onChange={(event) => setField('title', event.target.value)}
          />
          {errors.title ? <p className="field__message field__error">{errors.title}</p> : null}
        </div>

        <div className="dash-store__field">
          <span className="field__label">
            صورة الإعلان <span className="field__required" aria-hidden="true">*</span>
          </span>
          <div className="dash-store__image">
            {previewUrl ? (
              <img className="dash-store__image-preview" src={previewUrl} alt="معاينة صورة الإعلان" />
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
                  accept="image/jpeg,image/png,image/webp"
                  disabled={saving || uploading}
                  onChange={(event) => void handleImageChange(event)}
                />
              </label>
            </div>
          </div>
          <p className="dash-store__hint">JPG أو PNG أو WEBP، بحجم أقصاه 5 ميغابايت.</p>
          {imageError ? <p className="field__message field__error">{imageError}</p> : null}
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="announcement-body">
            نص الإعلان <span className="field__required" aria-hidden="true">*</span>
          </label>
          <textarea
            id="announcement-body"
            className="input textarea"
            rows={8}
            maxLength={MAX_BODY_LENGTH}
            value={values.body}
            disabled={saving}
            onChange={(event) => setField('body', event.target.value)}
          />
          <p className="dash-store__hint">تُحفظ أسطر النص كما هي.</p>
          {errors.body ? <p className="field__message field__error">{errors.body}</p> : null}
        </div>

        <div className="dash-store__field">
          <label className="field__label" htmlFor="announcement-date">
            تاريخ النشر
          </label>
          <input
            id="announcement-date"
            className="input"
            type="datetime-local"
            value={values.publishedAt}
            disabled={saving}
            onChange={(event) => setField('publishedAt', event.target.value)}
          />
          <p className="dash-store__hint">
            يمكنك تحديد تاريخ مستقبلي لجدولة النشر؛ ولن يظهر الإعلان قبل حلوله.
          </p>
          {errors.publishedAt ? (
            <p className="field__message field__error">{errors.publishedAt}</p>
          ) : null}
        </div>

        <div className="dash-store__modal-actions">
          <button
            type="button"
            className="btn btn--primary btn--md"
            disabled={saving || uploading}
            onClick={() => void submit('published')}
          >
            {saving && pendingAction === 'published' ? (
              <span className="btn__spinner" aria-hidden="true" />
            ) : null}
            <span className="btn__label">
              {saving && pendingAction === 'published' ? 'جارٍ النشر…' : 'نشر الإعلان'}
            </span>
          </button>
          <button
            type="button"
            className="btn btn--outline btn--md"
            disabled={saving || uploading}
            onClick={() => void submit('draft')}
          >
            {saving && pendingAction === 'draft' ? (
              <span className="btn__spinner" aria-hidden="true" />
            ) : null}
            <span className="btn__label">
              {saving && pendingAction === 'draft' ? 'جارٍ الحفظ…' : 'حفظ كمسودة'}
            </span>
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--md"
            disabled={saving}
            onClick={onCancel}
          >
            <span className="btn__label">إلغاء</span>
          </button>
        </div>
      </form>
    </div>
  );
}
