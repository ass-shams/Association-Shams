/**
 * Temporary Store catalogue — the single source of product data.
 *
 * Everything here is PLACEHOLDER content used to build the Store and Product
 * Details UI. This file (and `productService.ts`) is the only place that knows
 * where product data comes from. When the Admin Panel / database is ready,
 * replace the exports below with real records and every component keeps working
 * unchanged.
 *
 * Product images intentionally reuse existing association photographs from
 * `src/assets/aboutimage/` until final photography is available. Swap the
 * `images` array of a product to update its gallery.
 */
import type { Product, ProductImage, ProductReview } from '@/types';
import image01 from '@/assets/aboutimage/image01.jpg';
import image02 from '@/assets/aboutimage/image02.jpg';
import image03 from '@/assets/aboutimage/image03.jpg';
import image04 from '@/assets/aboutimage/image04.jpg';
import image05 from '@/assets/aboutimage/image05.jpg';
import image06 from '@/assets/aboutimage/image06.jpg';
import image07 from '@/assets/aboutimage/image07.jpg';
import image08 from '@/assets/aboutimage/image08.jpg';

const gallerySources = [image01, image02, image03, image04, image05, image06, image07, image08];

/** Builds a temporary multi-image gallery for a product. */
function buildImages(name: string, start: number, count = 3): ProductImage[] {
  return Array.from({ length: count }, (_, index) => ({
    src: gallerySources[(start + index) % gallerySources.length],
    alt: `${name} - صورة ${index + 1}`,
  }));
}

let reviewSeed = 0;
function review(
  author: string,
  rating: number,
  date: string,
  comment: string,
): ProductReview {
  reviewSeed += 1;
  return { id: `review-${reviewSeed}`, author, rating, date, comment };
}

/** Temporary visual for the Store hero. Replace with the final Store image. */
export const storeHeroImage = {
  src: image07,
  alt: 'أعضاء جمعية شمس في لقاء جماعي أمام لافتة الجمعية',
} as const;

/** Temporary visual for the promotional banner. Replace when ready. */
export const storePromoImage = {
  src: image03,
  alt: 'مستفيدون في فضاء تعلم تابع لجمعية شمس',
} as const;

/** The full temporary catalogue. */
export const products: readonly Product[] = [
  {
    id: 'p-shirt',
    slug: 'shirt-shams',
    name: 'قميص الجمعية',
    category: 'ملابس',
    images: buildImages('قميص الجمعية', 1, 4),
    price: 150,
    compareAtPrice: 190,
    shortDescription: 'قميص قطني مريح يحمل شعار جمعية شمس، مناسب للفعاليات والاستعمال اليومي.',
    description:
      'قميص من القطن عالي الجودة يحمل شعار جمعية شمس للكفيف والمبصر، مصمم ليكون مريحاً وأنيقاً في الوقت نفسه.\nيصلح للارتداء خلال الفعاليات والأنشطة التي تنظمها الجمعية، كما يمكن استعماله في المناسبات اليومية.\nكل عملية اقتناء تدعم برامج الجمعية الموجهة للمكفوفين وضعاف البصر.',
    additionalInformation: [
      { label: 'المادة', value: 'قطن 100%' },
      { label: 'المقاسات المتوفرة', value: 'S / M / L / XL' },
      { label: 'اللون', value: 'أبيض مع شعار أزرق' },
      { label: 'طريقة العناية', value: 'غسل على البارد' },
    ],
    stock: 24,
    stockStatus: 'in_stock',
    sku: 'SHAMS-SHIRT-01',
    tags: ['ملابس', 'قميص', 'هوية الجمعية'],
    isFeatured: true,
    isNew: true,
    isBestSeller: true,
    relatedSlugs: ['shams-cap', 'shams-bag', 'shams-watch', 'shams-umbrella'],
    reviews: [
      review('ياسمين ب.', 5, '2026-08-14', 'جودة ممتازة والقماش مريح جداً. سعيد بدعم أنشطة الجمعية.'),
      review('كريم ر.', 4, '2026-07-30', 'المنتج مطابق للوصف، لكن المقاس جاء صغيراً قليلاً.'),
      review('نادية ص.', 5, '2026-06-21', 'تصميم جميل وتغليف أنيق، أنصح به.'),
    ],
  },
  {
    id: 'p-report-book',
    slug: 'annual-report-book',
    name: 'كتاب التقرير السنوي',
    category: 'منشورات',
    images: buildImages('كتاب التقرير السنوي', 2, 3),
    price: 80,
    shortDescription: 'منشور مطبوع يلخص أبرز أنشطة الجمعية ومشاريعها خلال العام.',
    description:
      'كتاب التقرير السنوي يقدم نظرة شاملة على أنشطة جمعية شمس وبرامجها ومشاريعها خلال السنة.\nيتضمن التقرير عرضاً لأهم المحطات والأنشطة التربوية والاجتماعية التي نفذتها الجمعية.',
    additionalInformation: [
      { label: 'عدد الصفحات', value: '64 صفحة' },
      { label: 'القياس', value: 'A4' },
      { label: 'اللغة', value: 'العربية' },
      { label: 'الغلاف', value: 'ورق مقوى' },
    ],
    stock: 40,
    stockStatus: 'in_stock',
    sku: 'SHAMS-BOOK-01',
    tags: ['منشورات', 'تقرير', 'كتاب'],
    isFeatured: true,
    isBestSeller: true,
    reviews: [
      review('أمين ع.', 5, '2026-05-12', 'محتوى غني ومفيد، يوثق مجهودات الجمعية بشكل رائع.'),
      review('سعاد ب.', 4, '2026-04-03', 'إخراج ممتاز للكتاب، في انتظار نسخة إلكترونية.'),
    ],
  },
  {
    id: 'p-cup',
    slug: 'shams-cup',
    name: 'كوب شمس',
    category: 'هدايا',
    images: buildImages('كوب شمس', 3, 3),
    price: 60,
    compareAtPrice: 75,
    shortDescription: 'كوب عملي يحمل هوية الجمعية، مناسب للاستعمال اليومي.',
    description:
      'كوب بسعة مناسبة للقهوة أو الشاي، يحمل شعار جمعية شمس.\nمصنوع من مادة متينة تتحمل الاستعمال اليومي، ويُعد هدية بسيطة ومعبّرة.',
    additionalInformation: [
      { label: 'السعة', value: '330 مل' },
      { label: 'المادة', value: 'خزف' },
      { label: 'آمن في الميكروويف', value: 'نعم' },
    ],
    stock: 3,
    stockStatus: 'low_stock',
    sku: 'SHAMS-CUP-01',
    tags: ['هدايا', 'كوب', 'يومي'],
    isFeatured: true,
    isBestSeller: true,
    reviews: [
      review('ليلى ح.', 5, '2026-09-02', 'الكوب جميل وعملي، أحببت الشعار عليه.'),
      review('ياسين م.', 4, '2026-08-19', 'جيد جداً مقابل الثمن.'),
      review('نادية ص.', 3, '2026-07-11', 'التغليف كان بسيطاً بعض الشيء.'),
    ],
  },
  {
    id: 'p-bag',
    slug: 'shams-bag',
    name: 'حقيبة الجمعية',
    category: 'حقائب',
    images: buildImages('حقيبة الجمعية', 4, 3),
    price: 120,
    shortDescription: 'حقيبة قابلة لإعادة الاستخدام تحمل شعار الجمعية.',
    description:
      'حقيبة عملية وقابلة لإعادة الاستخدام، مناسبة للتنقل وللتسوق، وتحمل شعار جمعية شمس.\nخيار صديق للبيئة وبديل جيد للأكياس البلاستيكية.',
    additionalInformation: [
      { label: 'المادة', value: 'قماش قطن ثقيل' },
      { label: 'الأبعاد', value: '38 × 42 سم' },
      { label: 'اللون', value: 'أزرق' },
    ],
    stock: 18,
    stockStatus: 'in_stock',
    sku: 'SHAMS-BAG-01',
    tags: ['حقائب', 'صديق للبيئة'],
    isFeatured: true,
    reviews: [
      review('سعاد ب.', 5, '2026-06-18', 'متينة وتتسع كثيراً، استعملها كل يوم.'),
    ],
  },
  {
    id: 'p-badge',
    slug: 'membership-badge',
    name: 'شارة العضوية',
    category: 'إكسسوارات',
    images: buildImages('شارة العضوية', 0, 2),
    price: 40,
    shortDescription: 'شارة تعريفية يرتديها الأعضاء خلال الأنشطة والفعاليات.',
    description:
      'شارة عضوية تحمل اسم الجمعية، تُمنح للأعضاء لارتدائها خلال الأنشطة والفعاليات الرسمية.',
    additionalInformation: [
      { label: 'المادة', value: 'معدن مطلي' },
      { label: 'الحجم', value: 'قطر 4 سم' },
    ],
    stock: 60,
    stockStatus: 'in_stock',
    sku: 'SHAMS-BADGE-01',
    tags: ['إكسسوارات', 'عضوية'],
    isBestSeller: true,
    reviews: [
      review('أمين ع.', 5, '2026-05-28', 'قطعة أنيقة وتذكرني بمسؤوليتي كعضو.'),
      review('كريم ر.', 4, '2026-05-05', 'جودة جيدة، لكن التثبيت يمكن أن يكون أفضل.'),
    ],
  },
  {
    id: 'p-poster',
    slug: 'awareness-poster',
    name: 'ملصق توعوي',
    category: 'منشورات',
    images: buildImages('ملصق توعوي', 5, 2),
    price: 30,
    shortDescription: 'ملصق يُستخدم في الحملات والفعاليات المجتمعية.',
    description:
      'ملصق توعوي بتصميم واضح يستهدف نشر الوعي حول قضايا الإدماج والوصول. مناسب للحملات والمدارس والفضاءات العمومية.',
    additionalInformation: [
      { label: 'القياس', value: '50 × 70 سم' },
      { label: 'الطباعة', value: 'ألوان عالية الجودة' },
    ],
    stock: 0,
    stockStatus: 'out_of_stock',
    tags: ['منشورات', 'توعية'],
    reviews: [],
  },
  {
    id: 'p-medal',
    slug: 'shams-medal',
    name: 'ميدالية شمس',
    category: 'هدايا',
    images: buildImages('ميدالية شمس', 6, 2),
    price: 70,
    shortDescription: 'ميدالية تذكارية تحمل شعار الجمعية.',
    description:
      'ميدالية تذكارية تُقدَّم في المناسبات والمسابقات التي تنظمها الجمعية، تحمل شعار جمعية شمس.',
    additionalInformation: [
      { label: 'المادة', value: 'معدن مطلي بالذهب' },
      { label: 'الحجم', value: 'قطر 5 سم' },
    ],
    stock: 12,
    stockStatus: 'in_stock',
    sku: 'SHAMS-MEDAL-01',
    tags: ['هدايا', 'تذكار'],
    isBestSeller: true,
    reviews: [
      review('ليلى ح.', 5, '2026-09-10', 'هدية قيمة، تصميم راقٍ.'),
      review('ياسين م.', 4, '2026-08-01', 'جميلة جداً، في انتظار المزيد من التصاميم.'),
    ],
  },
  {
    id: 'p-notebook',
    slug: 'shams-notebook',
    name: 'دفتر الجمعية',
    category: 'قرطاسية',
    images: buildImages('دفتر الجمعية', 7, 3),
    price: 45,
    shortDescription: 'دفتر عملي يحمل هوية الجمعية، مناسب للدراسة والتسجيل.',
    description:
      'دفتر بغلاف يحمل شعار جمعية شمس، بأوراق مسطّرة مناسبة للدراسة والتدوين اليومي.',
    additionalInformation: [
      { label: 'عدد الأوراق', value: '120 ورقة' },
      { label: 'القياس', value: 'A5' },
      { label: 'نوع الورق', value: 'مسطّر' },
    ],
    stock: 35,
    stockStatus: 'in_stock',
    sku: 'SHAMS-NOTE-01',
    tags: ['قرطاسية', 'دفتر'],
    isNew: true,
    reviews: [
      review('نادية ص.', 5, '2026-08-25', 'ورق جيد وسعر مناسب.'),
    ],
  },
  {
    id: 'p-cap',
    slug: 'shams-cap',
    name: 'قبعة شمس',
    category: 'ملابس',
    images: buildImages('قبعة شمس', 0, 3),
    price: 90,
    shortDescription: 'قبعة عملية تحمل شعار الجمعية، مناسبة للأنشطة الخارجية.',
    description:
      'قبعة خفيفة وعملية تحمل شعار جمعية شمس، مناسبة للرحلات والأنشطة الخارجية والاستعمال اليومي.',
    additionalInformation: [
      { label: 'المادة', value: 'قطن' },
      { label: 'المقاس', value: 'قابل للتعديل' },
      { label: 'اللون', value: 'أزرق' },
    ],
    stock: 20,
    stockStatus: 'in_stock',
    sku: 'SHAMS-CAP-01',
    tags: ['ملابس', 'قبعة'],
    isNew: true,
    reviews: [
      review('كريم ر.', 4, '2026-07-19', 'خفيفة ومريحة، أخذتها في الرحلة.'),
    ],
  },
  {
    id: 'p-umbrella',
    slug: 'shams-umbrella',
    name: 'مظلة الجمعية',
    category: 'إكسسوارات',
    images: buildImages('مظلة الجمعية', 1, 2),
    price: 130,
    compareAtPrice: 160,
    shortDescription: 'مظلة متينة تحمل شعار الجمعية.',
    description:
      'مظلة متينة وقابلة للطي، تحمل شعار جمعية شمس، مناسبة للاستعمال اليومي وللأنشطة الخارجية.',
    additionalInformation: [
      { label: 'المادة', value: 'بوليستر مقاوم للماء' },
      { label: 'اللون', value: 'أزرق داكن' },
    ],
    stock: 9,
    stockStatus: 'in_stock',
    sku: 'SHAMS-UMB-01',
    tags: ['إكسسوارات', 'مظلة'],
    reviews: [],
  },
  {
    id: 'p-pens',
    slug: 'pen-set',
    name: 'علبة أقلام',
    category: 'قرطاسية',
    images: buildImages('علبة أقلام', 3, 2),
    price: 50,
    shortDescription: 'علبة أقلام تحمل شعار الجمعية، هدية مناسبة للطلبة.',
    description:
      'علبة تحتوي على مجموعة أقلام عملية تحمل شعار جمعية شمس، مناسبة للدراسة وللتقديم كهدية.',
    additionalInformation: [
      { label: 'عدد الأقلام', value: '5 أقلام' },
      { label: 'اللون', value: 'أزرق وأصفر' },
    ],
    stock: 48,
    stockStatus: 'in_stock',
    sku: 'SHAMS-PEN-01',
    tags: ['قرطاسية', 'أقلام'],
    isNew: true,
    reviews: [
      review('أمين ع.', 5, '2026-09-01', 'هدية رائعة للأطفال، جودة جيدة.'),
      review('سعاد ب.', 4, '2026-08-08', 'مناسبة جداً مع بداية الدراسة.'),
    ],
  },
  {
    id: 'p-watch',
    slug: 'shams-watch',
    name: 'ساعة شمس',
    category: 'إكسسوارات',
    images: buildImages('ساعة شمس', 4, 3),
    price: 200,
    compareAtPrice: 250,
    shortDescription: 'ساعة أنيقة تحمل هوية الجمعية.',
    description:
      'ساعة أنيقة بتصميم بسيط تحمل شعار جمعية شمس، مناسبة للاستعمال اليومي وللتقديم كهدية مميزة.',
    additionalInformation: [
      { label: 'نوع الحركة', value: 'كوارتز' },
      { label: 'مقاومة الماء', value: 'خفيفة' },
      { label: 'لون الحزام', value: 'أزرق' },
    ],
    stock: 7,
    stockStatus: 'in_stock',
    sku: 'SHAMS-WATCH-01',
    tags: ['إكسسوارات', 'ساعة'],
    reviews: [
      review('ليلى ح.', 4, '2026-06-30', 'تصميم أنيق، والمقابل يخدم هدفاً نبيلاً.'),
      review('ياسين م.', 5, '2026-06-02', 'أعجبتني كثيراً، جودة ممتازة.'),
    ],
  },
];
