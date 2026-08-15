/**
 * Site search — replaces the old Site Index in the navigation.
 * Copy editable in the CMS under Site settings → "Search page".
 */
import Head from 'next/head';
import Layout, { SiteSettings } from '../components/Layout';
import PageHero from '../components/PageHero';
import SearchBox from '../components/SearchBox';
import { getSite } from '../lib/content';

export default function SearchPage({ site }: { site: SiteSettings }) {
  const sp = site.searchPage || {};
  return (
    <>
      <Head>
        <title>{`${sp.title || 'Search'} — ${site.siteTitle}`}</title>
      </Head>
      <Layout site={site}>
        <PageHero
          eyebrow={sp.eyebrow}
          title={sp.title || 'Search'}
          subtitle={sp.subtitle}
        />
        <main className="page-main">
          <div className="container container-narrow">
            <SearchBox placeholder={sp.placeholder} noResultsText={sp.noResults} autoFocus />
          </div>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  return { props: { site: getSite() } };
}
