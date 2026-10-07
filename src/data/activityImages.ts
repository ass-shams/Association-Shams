/**
 * Centralised image configuration for the Activities page.
 *
 * The Activities page uses a SINGLE image — the Hero visual. It is kept here
 * so the temporary asset can be replaced later with the real association
 * photograph by editing this file only, without touching the page.
 *
 * `position` maps to CSS `object-position` and is used to keep the important
 * subject inside the frame when the Hero crops the image.
 */
import heroImage from '@/assets/aboutimage/image07.jpg';

export interface ActivityImage {
  /** Local image import. */
  readonly src: string;
  /** Arabic alt text describing the image (accessibility). */
  readonly alt: string;
  /** Optional CSS object-position used when the Hero crops the image. */
  readonly position?: string;
}

export const activityImages = {
  /** Hero — the only image on the Activities page. */
  hero: {
    src: heroImage,
    alt: 'أعضاء جمعية شمس للكفيف والمبصر في لقاء جماعي يعكس روح المشاركة والإدماج',
    position: 'center 72%',
  },
} satisfies Record<string, ActivityImage>;
