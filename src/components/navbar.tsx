import { useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import MobileMenu from '@/components/mobilemenu';
import logo from '@/assets/navbar-footer.png';

export interface NavLinkItem {
  to: string;
  label: string;
}

/** Top navigation, hardcoded here and reused by the mobile menu. */
export const NAV_LINKS: readonly NavLinkItem[] = [
  { to: '/', label: 'الرئيسية' },
  { to: '/about', label: 'من نحن' },
  { to: '/activities', label: 'أنشطتنا' },
  { to: '/store', label: 'المتجر' },
  { to: '/documents', label: 'الوثائق الإدارية' },
  { to: '/membership', label: 'الانخراط' },
  { to: '/competitions', label: 'المسابقات' },
  { to: '/contact', label: 'اتصل بنا' },
];

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

/** Sticky site header with the desktop navigation and the mobile menu trigger. */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink className="site-brand" to="/" onClick={closeMenu}>
          <img src={logo} alt="جمعية شمس" />
        </NavLink>

        <nav className="site-nav" aria-label="التنقل الرئيسي">
          <ul className="site-nav__list">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  className={({ isActive }) =>
                    isActive ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
                  }
                  to={link.to}
                  end={link.to === '/'}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-actions">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label="فتح القائمة"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      <div id="mobile-navigation">
        <MobileMenu open={menuOpen} onClose={closeMenu} />
      </div>
    </header>
  );
}
