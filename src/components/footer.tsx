import { Fragment, type ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '@/assets/navbar-footer.png';

/** Association identity, kept in sync with the wording used across the site. */
const BRAND_NAME = 'جمعية شمس للكفيف والمبصر';
const BRAND_DESCRIPTION =
  'منظمة مغربية رائدة تأسست بمدينة بني ملال، وتشكّل جسراً تضامنياً يهدف إلى تحقيق الإدماج الشامل للمكفوفين وضعاف البصر داخل المجتمع جنباً إلى جنب مع المبصرين.';

const COPY_YEAR = 2026;

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M14 8.5h2.5V5.6h-2.6c-2.2 0-3.7 1.5-3.7 3.8V11H8v2.8h2.2V21h3v-7.2H16l.5-2.8h-3.3V9.5c0-.6.3-1 .8-1Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

interface FooterLink {
  to: string;
  label: string;
  end?: boolean;
}

/** Only real, mounted routes — see the route table in `App.tsx`. */
const QUICK_LINKS: readonly FooterLink[] = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/about', label: 'من نحن' },
  { to: '/activities', label: 'أنشطتنا' },
  { to: '/store', label: 'المتجر' },
];

interface ContactLink {
  text: string;
  href?: string;
}

interface ContactItem {
  id: string;
  label: string;
  icon: () => ReactElement;
  links: readonly ContactLink[];
}

/** Official contact details as published by the association. */
const CONTACT_ITEMS: readonly ContactItem[] = [
  {
    id: 'email',
    label: 'البريد الإلكتروني',
    icon: MailIcon,
    links: [{ text: 'ass.shamsam@gmail.com', href: 'mailto:ass.shamsam@gmail.com' }],
  },
  {
    id: 'phone',
    label: 'أرقام الهاتف',
    icon: PhoneIcon,
    links: [
      { text: '0640635750', href: 'tel:+212640635750' },
      { text: '0663071162', href: 'tel:+212663071162' },
    ],
  },
  {
    id: 'address',
    label: 'العنوان',
    icon: LocationIcon,
    links: [{ text: 'الجيش الملكي , Beni Mellal, Morocco, 23000' }],
  },
];

/** Official social profiles published by the association. */
const SOCIAL_LINKS = [
  { id: 'facebook', label: 'فيسبوك', href: 'https://www.facebook.com/Association.chams', icon: FacebookIcon },
  { id: 'instagram', label: 'إنستغرام', href: 'https://www.instagram.com/ass.shams', icon: InstagramIcon },
] as const;

/** Smooth scroll that honours the reduced-motion preference. */
function scrollToTop() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

/**
 * The single shared Footer for every public page. It is rendered once by the
 * public shell in `App.tsx`, so editing this file updates the whole site.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__main">
        <div className="footer-grid">
          <div className="footer-brand">
            <NavLink className="footer-brand__link" to="/" aria-label="جمعية شمس — الصفحة الرئيسية">
              <img
                className="footer-brand__logo"
                src={logo}
                alt="شعار جمعية شمس للكفيف والمبصر"
                width={380}
                height={80}
                loading="lazy"
                decoding="async"
              />
            </NavLink>

            <p className="footer-brand__name">{BRAND_NAME}</p>
            <p className="footer-brand__text">{BRAND_DESCRIPTION}</p>

            <nav className="footer-social" aria-label="وسائل التواصل الاجتماعي">
              <ul className="footer-social__list">
                {SOCIAL_LINKS.map((item) => (
                  <li key={item.id}>
                    <a
                      className="footer-social__link"
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                    >
                      <item.icon />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <nav className="footer-col" aria-label="روابط سريعة">
            <h2 className="footer-heading">روابط سريعة</h2>
            <ul className="footer-list">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink className="footer-link" to={link.to} end={link.end}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer-col footer-contact">
            <h2 className="footer-heading">تواصل معنا</h2>

            <ul className="footer-contact__list">
              {CONTACT_ITEMS.map((item) => (
                <li key={item.id} className="footer-contact__item">
                  <span className="footer-contact__icon" aria-hidden="true">
                    <item.icon />
                  </span>
                  <span className="footer-contact__body">
                    <span className="footer-contact__label">{item.label}</span>
                    <span className="footer-contact__values">
                      {item.links.map((link, index) => (
                        <Fragment key={link.text}>
                          {index > 0 && (
                            <span className="footer-contact__sep" aria-hidden="true">
                              ·
                            </span>
                          )}
                          {link.href ? (
                            <a className="footer-contact__value" href={link.href}>
                              {link.text}
                            </a>
                          ) : (
                            <span className="footer-contact__value">{link.text}</span>
                          )}
                        </Fragment>
                      ))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom__inner">
          <p className="footer-copyright">© {COPY_YEAR} جمعية شمس. جميع الحقوق محفوظة.</p>

          <div className="footer-bottom__actions">
            <button
              type="button"
              className="footer-top"
              onClick={scrollToTop}
              aria-label="العودة إلى أعلى الصفحة"
            >
              <ArrowUpIcon />
              <span>العودة إلى الأعلى</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
