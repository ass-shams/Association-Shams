import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ACCEPT_VIDEO_ATTRIBUTE } from '../constants';
import {
  formatDuration,
  formatFileSize,
  isAcceptedVideoFile,
  isVideoDurationValid,
  VIDEO_FORMAT_MESSAGE,
  VIDEO_TOO_LONG_MESSAGE,
  VIDEO_UNREADABLE_MESSAGE,
} from '../validation';
import type { SelectedVideo } from '../types';

export interface VideoUploadFieldProps {
  readonly value: SelectedVideo | null;
  readonly onChange: (value: SelectedVideo | null) => void;
  readonly onErrorChange: (message: string) => void;
  readonly error?: string;
  readonly disabled?: boolean;
}

const INPUT_ID = 'gv-video-input';
const LABEL_ID = 'gv-video-label';
const ERROR_ID = 'gv-video-error';

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

function FilmIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="2.5" y="4" width="19" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M2.5 9h4.5M2.5 15h4.5M17 9h4.5M17 15h4.5" />
    </svg>
  );
}

/**
 * Read a video file's duration from browser metadata without uploading it.
 * Resolves only when a finite, positive duration is available.
 */
function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();

      if (Number.isFinite(duration) && duration > 0) {
        resolve(duration);
      } else {
        reject(new Error('unreadable'));
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('unreadable'));
    };

    video.src = objectUrl;
  });
}

/**
 * Conditional video picker shown only for participants from outside
 * Beni Mellal-Khenifra. The selected file is inspected locally and never
 * uploaded; duration is enforced when browser metadata is available.
 */
export default function VideoUploadField({
  value,
  onChange,
  onErrorChange,
  error,
  disabled = false,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAcceptedVideoFile(file.name, file.type)) {
      onChange(null);
      onErrorChange(VIDEO_FORMAT_MESSAGE);
      if (event.target.value) {
        event.target.value = '';
      }
      return;
    }

    setIsChecking(true);
    onErrorChange('');

    try {
      const durationSeconds = await readVideoDuration(file);

      if (!isVideoDurationValid(durationSeconds)) {
        onChange(null);
        onErrorChange(VIDEO_TOO_LONG_MESSAGE);
        return;
      }

      onChange({ file, durationSeconds });
    } catch {
      onChange(null);
      onErrorChange(VIDEO_UNREADABLE_MESSAGE);
    } finally {
      setIsChecking(false);
    }
  }

  function handleRemove() {
    onChange(null);
    onErrorChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="gv-video">
      <span className="field__label" id={LABEL_ID}>
        رفع فيديو المشاركة
        <span className="field__required" aria-hidden="true">
          *
        </span>
      </span>

      <p className="gv-video__note">
        إذا كنت من خارج جهة بني ملال خنيفرة، فيجب إرفاق فيديو للمشاركة لا تتجاوز مدته ثلاث
        دقائق.
      </p>

      <input
        ref={inputRef}
        className="gv-video__input"
        id={INPUT_ID}
        type="file"
        accept={ACCEPT_VIDEO_ATTRIBUTE}
        disabled={disabled}
        aria-labelledby={LABEL_ID}
        aria-describedby={error ? ERROR_ID : undefined}
        onChange={handleFileChange}
      />

      {value ? (
        <div className="gv-video__selected">
          <span className="gv-video__selected-icon" aria-hidden="true">
            <FilmIcon />
          </span>

          <div className="gv-video__meta">
            <p className="gv-video__filename" dir="auto">
              {value.file.name}
            </p>
            <p className="gv-video__details">
              {formatFileSize(value.file.size)} · المدة {formatDuration(value.durationSeconds)}
            </p>
          </div>

          <div className="gv-video__actions">
            <label className="btn btn--secondary btn--sm" htmlFor={INPUT_ID}>
              استبدال
            </label>
            <button type="button" className="btn btn--ghost btn--sm" onClick={handleRemove}>
              إزالة
            </button>
          </div>
        </div>
      ) : (
        <label className="gv-video__dropzone" htmlFor={INPUT_ID}>
          {isChecking ? (
            <span className="gv-video__spinner" aria-hidden="true" />
          ) : (
            <span className="gv-video__dropzone-icon" aria-hidden="true">
              <UploadIcon />
            </span>
          )}
          <span className="gv-video__dropzone-title">
            {isChecking ? 'جارٍ التحقق من الفيديو…' : 'رفع فيديو المشاركة'}
          </span>
          <span className="gv-video__dropzone-help">يجب ألا تتجاوز مدة الفيديو ثلاث دقائق.</span>
        </label>
      )}

      {error ? (
        <p className="field__message field__error" id={ERROR_ID} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
