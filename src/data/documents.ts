/**
 * Centralised catalogue of the association's administrative PDF documents.
 *
 * The five files below are the real assets that live in
 * `src/assets/documents/`. Importing them with Vite returns their final,
 * content-hashed URL (same origin in both dev and production), so each card
 * can download its own file reliably while `fileName` preserves the original
 * name. Update this file only when a document is added or replaced.
 */
import doc0 from '@/assets/documents/founding-minutes.pdf';
import doc1 from '@/assets/documents/association-charter.pdf';
import doc2 from '@/assets/documents/general-assembly.pdf';
import doc3 from '@/assets/documents/final-deposit-receipt.pdf';
import doc4 from '@/assets/documents/ATTESTATION DE COMPTE.pdf';

export interface DocumentItem {
  /** Stable key used by React and by the search. */
  readonly id: string;
  /** Original file name, used both for display and for the download name. */
  readonly fileName: string;
  /** Short contextual description in Arabic. */
  readonly description: string;
  /** Exact size of the current file, in bytes. */
  readonly sizeBytes: number;
  /** Resolved, content-hashed URL emitted by Vite. */
  readonly url: string;
}

/** The association's administrative library, in the order it is displayed. */
export const documents: readonly DocumentItem[] = [
  {
    id: 'founding-minutes',
    fileName: 'عقد جمع عام لتأسيس جمعية شمس للكفيف و المبصر .pdf',
    description: 'محضر الجمع العام التأسيسي الذي تم فيه تأسيس جمعية شمس للكفيف والمبصر.',
    sizeBytes: 610389,
    url: doc0,
  },
  {
    id: 'association-charter',
    fileName: 'القانون الأساسي لجمعية شمس للكفيف و المبصر.pdf',
    description: 'النظام الأساسي للجمعية الذي يحدد أهدافها وهيكلها التنظيمي وقواعد عملها.',
    sizeBytes: 1788219,
    url: doc1,
  },
  {
    id: 'general-assembly',
    fileName: 'الجمع العام العادي و الاستتنائي.pdf',
    description: 'محضر الجمع العام العادي والاستثنائي للجمعية والقرارات المتخذة خلاله.',
    sizeBytes: 340678,
    url: doc2,
  },
  {
    id: 'final-deposit-receipt',
    fileName: 'وصل الايداع النهائي.pdf',
    description: 'وصل الإيداع النهائي المتعلق بملف الجمعية لدى الجهات المختصة.',
    sizeBytes: 247120,
    url: doc3,
  },
  {
    id: 'account-attestation',
    fileName: 'ATTESTATION DE COMPTE.pdf',
    description: 'شهادة بنكية تخص الحساب البنكي للجمعية (Attestation de compte bancaire).',
    sizeBytes: 486395,
    url: doc4,
  },
];
