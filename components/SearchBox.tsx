/**
 * Client-side site search over public/search-index.json (built at compile
 * time from the CMS content, so it is always in sync). No external service:
 * the index is a ~100-entry JSON the browser filters instantly.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Doc = { t: string; u: string; k: string; s: string; x: string; b: string };

const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';

function score(doc: Doc, terms: string[]): number {
  let total = 0;
  const title = doc.t.toLowerCase();
  const sub = doc.s.toLowerCase();
  for (const term of terms) {
    let s = 0;
    if (title.includes(term)) s += title.startsWith(term) ? 30 : 20;
    if (sub.includes(term)) s += 8;
    if (doc.b.includes(term)) s += 4;
    if (s === 0) return 0; // every term must match somewhere
    total += s;
  }
  return total;
}

export default function SearchBox({
  placeholder,
  noResultsText,
  autoFocus,
}: {
  placeholder?: string;
  noResultsText?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState('');
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const loading = useRef(false);

  // read ?q= on first render (the header icon links to search.html?q=…)
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) setQ(initial);
  }, []);

  const ensureIndex = () => {
    if (docs || loading.current) return;
    loading.current = true;
    fetch(`${bp}/search-index.json`)
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => setDocs([]));
  };

  // load immediately when arriving with a query
  useEffect(() => {
    if (q) ensureIndex();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!docs || terms.length === 0) return [];
    return docs
      .map((d) => ({ d, s: score(d, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 20)
      .map((r) => r.d);
  }, [q, docs]);

  const active = q.trim().length > 1;

  return (
    <div className="search-box">
      <div className="search-input-wrap">
        <svg
          className="search-glyph"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.5-4.5" />
        </svg>
        <input
          type="search"
          value={q}
          placeholder={placeholder || 'Search the site…'}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            ensureIndex();
          }}
          onFocus={ensureIndex}
          aria-label="Search the site"
        />
      </div>
      {active && docs && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="search-empty">{noResultsText || 'Nothing found for that search.'}</p>
          ) : (
            results.map((d) => (
              <a className="search-result" href={d.u} key={d.u}>
                <span className="search-result-kind">{d.k}</span>
                <span className="search-result-title">{d.t}</span>
                {d.s && <span className="search-result-sub">{d.s}</span>}
                {d.x && <span className="search-result-excerpt">{d.x}</span>}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
