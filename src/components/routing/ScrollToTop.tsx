import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Restores the scroll position to the top on every navigation.
 * Foundation for Arabic single-page navigation behaviour.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}