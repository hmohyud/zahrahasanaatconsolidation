/**
 * Stories index — cards + theme filter chips. Markup ids/classes match the
 * original static page so public/site.js's filter logic works unchanged.
 */
import Head from 'next/head';
import Layout, { SiteSettings } from '../components/Layout';
import PageHero from '../components/PageHero';
import { getSite, listStoriesMeta } from '../lib/content';

type StoryMeta = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  heroImage: string | null;
};

export default function StoriesIndex({
  site,
  stories,
  themes,
}: {
  site: SiteSettings;
  stories: StoryMeta[];
  themes: string[];
}) {
  return (
    <>
      <Head>
        <title>{`Stories — ${site.siteTitle}`}</title>
      </Head>
      <Layout site={site}>
        <PageHero
          eyebrow="Zahra Hasanaat"
          title="Stories"
          subtitle="Real stories of lives changed through compassion and service."
        />
        <main className="page-main">
          <div className="container">
            <div className="stories-filter" id="storyFilter">
              <div className="filter-chips">
                <button className="filter-chip active" data-filter="all">
                  All
                </button>
                {themes.map((t) => (
                  <button className="filter-chip" data-filter={t} key={t}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="story-grid story-grid--index" id="storyGrid">
              {stories.map((s) => (
                <a
                  className="story-card reveal"
                  href={`${s.slug}.html`}
                  key={s.slug}
                  data-cats={s.tags.join('|')}
                >
                  {s.heroImage ? (
                    <div className="story-img-wrapper">
                      <img className="story-img" src={s.heroImage} alt={s.title} loading="lazy" />
                    </div>
                  ) : (
                    <div className="story-img-wrapper is-ph">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  )}
                  <div className="story-card-body">
                    {s.date && <div className="story-card-date">{s.date}</div>}
                    <div className="story-card-title">{s.title}</div>
                  </div>
                </a>
              ))}
            </div>
            <p className="stories-empty" id="storiesEmpty" hidden>
              No stories in this theme yet.
            </p>
          </div>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const stories = listStoriesMeta();
  const themes = Array.from(new Set(stories.flatMap((s) => s.tags))).sort();
  return { props: { site: getSite(), stories, themes } };
}
