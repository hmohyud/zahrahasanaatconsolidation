/**
 * Renders every standard page and story at its original flat URL
 * (e.g. /get-involved, /story-medical-camp → exported as <slug>.html).
 * `useTina` makes the page live-editable inside /admin once Tina Cloud is
 * connected; regular visitors just get the build-time content.
 */
import Head from 'next/head';
import { useTina } from 'tinacms/dist/react';
import Layout, { SiteSettings } from '../components/Layout';
import PageHero from '../components/PageHero';
import RichBody from '../components/RichBody';
import {
  getPage,
  getStory,
  getSite,
  listPageSlugs,
  listStorySlugs,
  PAGE_QUERY,
  STORY_QUERY,
} from '../lib/content';

type Props = {
  kind: 'page' | 'story';
  slug: string;
  site: SiteSettings;
  data: any;
  query: string;
  variables: { relativePath: string };
};

export default function ContentPage(props: Props) {
  const { data } = useTina({
    query: props.query,
    variables: props.variables,
    data: props.data,
  });
  const doc = props.kind === 'page' ? data.page : data.story;
  const site = props.site;

  return (
    <>
      <Head>
        <title>{`${doc.title} — ${site.siteTitle}`}</title>
      </Head>
      <Layout site={site}>
        <PageHero
          eyebrow={doc.eyebrow}
          title={doc.title}
          subtitle={props.kind === 'story' ? doc.date : doc.subtitle}
          heroImage={doc.heroImage}
        />
        <main className="page-main">
          <div className="container container-narrow">
            <article className="page-content reveal">
              {props.kind === 'story' && (
                <p className="story-back">
                  <a href="stories.html">&larr; All Stories</a>
                </p>
              )}
              <RichBody content={doc.body} />
              {props.kind === 'story' && doc.tags?.length > 0 && (
                <div className="story-tags">
                  {doc.tags.map((t: string) => (
                    <span className="story-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </article>
            {props.kind === 'page' &&
              doc.related?.map(
                (section: any, si: number) =>
                  section?.links?.length > 0 && (
                    <div className="related" key={si}>
                      <h3 className="related-title">{section.title || 'Explore further'}</h3>
                      <div className="related-links">
                        {section.links.map((r: any, i: number) => (
                          <a href={r.href} key={i}>
                            {r.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ),
              )}
          </div>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticPaths() {
  const paths = [...listPageSlugs(), ...listStorySlugs()].map((slug) => ({
    params: { slug },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const site = getSite();
  const page = getPage(params.slug);
  if (page) {
    return {
      props: {
        kind: 'page',
        slug: params.slug,
        site,
        data: { page },
        query: PAGE_QUERY,
        variables: { relativePath: `${params.slug}.mdx` },
      },
    };
  }
  const story = getStory(params.slug);
  return {
    props: {
      kind: 'story',
      slug: params.slug,
      site,
      data: { story },
      query: STORY_QUERY,
      variables: { relativePath: `${params.slug}.mdx` },
    },
  };
}
