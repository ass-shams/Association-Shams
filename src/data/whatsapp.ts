/**
 * WhatsApp contact configuration.
 *
 * `WHATSAPP_PHONE` is the association's official number already used across the
 * site (see `finalCTA.tsx`). Change the number here to update the link.
 */
export const WHATSAPP_PHONE = '212663071162';

export const WHATSAPP_DEFAULT_MESSAGE = 'السلام عليكم، أريد التواصل مع جمعية شمس.';

/** Builds a wa.me link with an optional pre-filled Arabic message. */
export function getWhatsAppLink(message: string = WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
