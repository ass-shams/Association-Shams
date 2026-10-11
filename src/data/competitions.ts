import goldenVoiceImage from '@/assets/competitions-images/golden-voice-image.webp';
import type { Competition } from '@/types';

/**
 * Presentation defaults for the competitions page.
 *
 * Live, managed fields (registration status, deadline and participant count)
 * come from the `/api/competitions` endpoint via `competitionsService` and are
 * merged over these entries by slug. Only content that is not managed in the
 * dashboard lives here (cover image and detail route), so there is never a
 * stale or invented participant count.
 */
export const competitions: readonly Competition[] = [
  {
    slug: 'golden-voice',
    title: 'مسابقة الصوت الذهبي للأغنية العربية والغربية',
    description:
      'بدعم من وزارة الشباب والثقافة والتواصل قطاع الثقافة تعلن الجمعية عن انطلاق عملية التسجيل للمشاركة في الدورة الثانية لمسابقة الصوت الذهبي للأغنية العربية والغربية',
    href: '/competitions/golden-voice',
    image: {
      src: goldenVoiceImage,
      alt: 'صورة توضيحية لمسابقة الصوت الذهبي',
    },
  },
];
