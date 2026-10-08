import goldenVoiceImage from '@/assets/competitions-images/golden-voice-image.png';
import type { Competition } from '@/types';

/**
 * Competitions organised by جمعية شمس.
 *
 * The `/competitions` page renders whatever is in this list, so adding a new
 * competition later is primarily a matter of appending a new object here.
 * `href` is omitted until a dedicated detail page exists.
 */
export const competitions: readonly Competition[] = [
  {
    slug: 'golden-voice',
    title: 'مسابقة الصوت الذهبي لللأغنية العربية و الامازيغية ',
    description:
      'بدعم من وزارة الشباب والثقافة والتواصل قطاع الثقافة تعلن الجمعية عن انطلاق عملية التسجيل للمشاركة في الدورة الثانية لمسابقة الصوت الذهبي للأغنية العربية والغربية',
    status: 'مفتوحة',
    href: '/competitions/golden-voice',
    image: {
      src: goldenVoiceImage,
      alt: 'صورة توضيحية لمسابقة الصوت الذهبي',
    },
    registrationDeadline: '23 أكتوبر 2026',
    participantsCount: 128,
  },
];
