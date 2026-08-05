/**
 * Branded 404 — reached by old URLs of pruned pages, or any typo.
 * Copy is editable in the CMS under Site settings → "Page not found".
 */
import Head from 'next/head';
import Layout, { SiteSettings } from '../components/Layout';
import PageHero from '../components/PageHero';
import { getSite } from '../lib/content';

export default function NotFound({ site }: { site: SiteSettings }) {
  const np = site.notFoundPage || {};
  return (
    <>
      <Head>
        <title>{`${np.title || 'Page not found'} — ${site.siteTitle}`}</title>
      </Head>
      <Layout site={site}>
        <PageHero
          eyebrow={np.eyebrow}
          title={np.title || 'Page not found'}
          subtitle={np.subtitle}
        />
        <main className="page-main">
          <div className="container container-narrow">
            <div className="related">
              <h3 className="related-title">{np.linksHeading || 'Try one of these'}</h3>
              <div className="related-links">
                {(np.links || []).map((l, i) => (
                  <a href={l.href} key={i}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  return { props: { site: getSite() } };
}
