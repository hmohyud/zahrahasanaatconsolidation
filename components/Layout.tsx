/**
 * Shared chrome: header with the nested dropdown nav, footer, back-to-top.
 * Markup mirrors the original static site exactly so styles/globals.css and
 * public/site.js keep working unchanged (site.js re-runs on each full page
 * load — navigation uses plain <a> tags on purpose).
 */
import React from 'react';

type NavItem = { label: string; href: string; children?: NavItem[] };
export type SiteSettings = {
  siteTitle: string;
  nav: NavItem[];
  footer: {
    brandText: string;
    contactEmail: string;
    copyright: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
  };
};

const isExternal = (href?: string) => /^https?:\/\//.test(href || '');

/** Small open-in-new-tab glyph shown after external nav links. */
function ExtIcon() {
  return (
    <svg
      className="ext-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function NavList({ items, depth = 0 }: { items: NavItem[]; depth?: number }) {
  return (
    <ul className={depth === 1 ? 'submenu' : depth === 2 ? 'subsubmenu' : undefined}>
      {items.map((item, i) => {
        const kids = item.children?.filter((c) => c && c.label) || [];
        const hasKids = kids.length > 0;
        const ext = isExternal(item.href);
        const cls =
          depth === 0
            ? hasKids
              ? 'has-submenu'
              : undefined
            : hasKids
              ? 'has-submenu has-subsub'
              : undefined;
        return (
          <li key={i} className={cls}>
            <a
              href={item.href}
              {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {item.label}
              {ext && <ExtIcon />}
            </a>
            {hasKids && <NavList items={kids} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

export function Header({ site }: { site: SiteSettings }) {
  return (
    <header className="site-header">
      <div className="container">
        <div className="site-title">
          <a href="index.html">{site.siteTitle}</a>
        </div>
        <button className="nav-toggle" id="navToggle" aria-label="Open menu" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="nav-overlay" id="navOverlay"></div>
        <nav id="mainNav" aria-label="Main navigation">
          <NavList items={site.nav} />
        </nav>
      </div>
    </header>
  );
}

export function Footer({ site }: { site: SiteSettings }) {
  const f = site.footer;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>{site.siteTitle}</h3>
            <p>{f.brandText}</p>
          </div>
          {f.columns?.map((col, i) => (
            <div key={i}>
              <h3>{col.title}</h3>
              <ul>
                {col.links?.map((l, j) => (
                  <li key={j}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3>Connect</h3>
            <p>
              <a href={`mailto:${f.contactEmail}`}>{f.contactEmail}</a>
            </p>
          </div>
        </div>
        <div className="footer-bottom">{f.copyright}</div>
      </div>
    </footer>
  );
}

export default function Layout({
  site,
  children,
}: {
  site: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header site={site} />
      {children}
      <Footer site={site} />
      <button className="back-to-top" id="backToTop" aria-label="Back to top">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}
