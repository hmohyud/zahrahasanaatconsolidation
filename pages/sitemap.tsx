/**
 * Site index — generated from the nav tree + full story list, so it can
 * never go stale when editors add pages or stories.
 */
import Head from 'next/head';
import Layout, { SiteSettings } from '../components/Layout';
import PageHero from '../components/PageHero';
import { getSite, listStoriesMeta } from '../lib/content';

type Col = { title: string; links: { label: string; href: string }[] };

export default function Sitemap({
  site,
  columns,
  stories,
}: {
  site: SiteSettings;
  columns: Col[];
  stories: { label: string; href: string }[];
}) {
  const mp = site.sitemapPage || {};
  return (
    <>
      <Head>
        <title>{`${mp.title} — ${site.siteTitle}`}</title>
      </Head>
      <Layout site={site}>
        <PageHero eyebrow={mp.eyebrow} title={mp.title} subtitle={mp.subtitle} />
        <main className="page-main">
          <div className="container">
            <div className="sitemap-grid">
              {columns.map((col, i) => (
                <div className="sitemap-col" key={i}>
                  <h3>{col.title}</h3>
                  <ul>
                    {col.links.map((l, j) => (
                      <li key={j}>
                        <a href={l.href}>{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="sitemap-col sitemap-col--wide">
                <h3>
                  {mp.storiesHeading} ({stories.length})
                </h3>
                <ul>
                  {stories.map((s, i) => (
                    <li key={i}>
                      <a href={s.href}>{s.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const site = getSite();
  const columns: Col[] = site.nav.map((item: any) => {
    const links: { label: string; href: string }[] = [];
    const walk = (n: any) => {
      if (n.href && n.label) links.push({ label: n.label, href: n.href });
      (n.children || []).forEach(walk);
    };
    walk(item);
    // de-dup hrefs (parent links often repeat as first child)
    const seen = new Set<string>();
    return {
      title: item.label,
      links: links.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true))),
    };
  });
  const stories = listStoriesMeta().map((s) => ({
    label: s.title,
    href: `${s.slug}.html`,
  }));
  return { props: { site, columns, stories } };
}
