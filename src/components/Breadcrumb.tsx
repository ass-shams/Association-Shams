import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  readonly label: string;
  readonly to?: string;
}

function Separator() {
  return (
    <svg
      className="breadcrumb__sep"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

/** Shared RTL breadcrumb; the final item is the current page. */
export default function Breadcrumb({ items }: { readonly items: readonly BreadcrumbItem[] }) {
  return (
    <nav className="breadcrumb" aria-label="مسار التنقل">
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="breadcrumb__item">
              {item.to && !isLast ? (
                <Link className="breadcrumb__link" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb__current" aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <Separator /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
