import Head from 'next/head';
import { useTina } from 'tinacms/dist/react';
import Layout, { SiteSettings } from '../components/Layout';
import { getHome, getSite, listStoriesMeta, HOME_QUERY } from '../lib/content';
import { asset } from '../lib/url';

const ICONS: Record<string, JSX.Element> = {
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  leaf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  hands: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5l4-7h9" />
      <path d="M13 7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5l-4 7h-9" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

function splitStat(value: string): { n: number; suffix: string } {
  const m = (value || '').match(/^(\d+)(.*)$/);
  return m ? { n: parseInt(m[1], 10), suffix: m[2] } : { n: 0, suffix: '' };
}

type StoryMeta = { slug: string; title: string; date: string; heroImage: string | null };

export default function HomePage(props: {
  site: SiteSettings;
  data: any;
  query: string;
  variables: { relativePath: string };
  featured: StoryMeta[];
}) {
  const { data } = useTina({ query: props.query, variables: props.variables, data: props.data });
  const home = data.home;
  const sec = home.sections || {};
  const site = props.site;

  return (
    <>
      <Head>
        <title>{`${site.siteTitle} — Service. Education. Harmony.`}</title>
      </Head>
      <Layout site={site}>
        {/* ---------- HERO ---------- */}
        <section
          className="hero hero--photo"
          style={{ ['--hero-img' as any]: `url('${asset(home.hero.image)}')` }}
        >
          <div className="hero-bg"></div>
          <div className="hero-pattern"></div>
          <div className="hero-inner">
            <h5 className="hero-anim">{home.hero.eyebrow}</h5>
            <div className="hero-divider hero-anim"></div>
            <h1
              className="hero-anim"
              dangerouslySetInnerHTML={{ __html: (home.hero.title || '').replace(/\n/g, '<br>') }}
            />
            <p className="hero-anim">{home.hero.text}</p>
            <div className="btn-group hero-anim">
              {home.hero.buttons?.map((b: any, i: number) => (
                <a href={b.href} className={`btn ${b.outline ? 'btn-outline' : 'btn-primary'}`} key={i}>
                  {b.label}
                </a>
              ))}
            </div>
          </div>
          <a href="#welcome" className="hero-scroll" aria-label="Scroll to content">
            <span></span>
          </a>
        </section>

        {/* ---------- WHY WE EXIST ---------- */}
        <section className="section welcome" id="welcome">
          <div className="container">
            <p className="welcome-lead">{home.why?.heading}</p>
            <p className="welcome-body">{home.why?.intro}</p>
          </div>
          <div className="container">
            <div className="card-grid why-grid">
              {home.why?.differentiators?.map((d: any, i: number) => (
                <div className="card card--static reveal" key={i}>
                  <h4>{d.heading}</h4>
                  <p>{d.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- PROGRAMS ---------- */}
        <section className="section section-alt" id="programs">
          <div className="container">
            <div className="section-header reveal">
              <h2 className="section-title">{sec.programsTitle}</h2>
              <p className="section-subtitle">{sec.programsSubtitle}</p>
            </div>
            <div className="card-grid">
              {home.programs?.map((p: any, i: number) => (
                <a className="card reveal" href={p.href} key={i}>
                  <div className="card-icon">{ICONS[p.icon] || ICONS.book}</div>
                  <h4>{p.title}</h4>
                  <p>{p.text}</p>
                  <span className="card-link">{sec.cardLinkLabel} &rarr;</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- IMPACT ---------- */}
        <section className="section section-primary impact-section">
          <div className="container">
            <div className="section-header reveal">
              <h2 className="section-title" style={{ color: 'white' }}>
                {sec.impactTitle}
              </h2>
            </div>
            <div className="impact-grid reveal">
              {home.impact?.map((s: any, i: number) => {
                const { n, suffix } = splitStat(s.number);
                return (
                  <div className="impact-item" key={i}>
                    <h3 data-count={n} data-suffix={suffix}>
                      {s.number}
                    </h3>
                    <p>{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- FEATURE ---------- */}
        <section className="feature">
          <div className="feature-media reveal">
            <img src={asset(home.feature.image)} alt={home.feature.title} loading="lazy" />
          </div>
          <div className="feature-body reveal">
            <h5>{home.feature.eyebrow}</h5>
            <h2>{home.feature.title}</h2>
            <p>{home.feature.text}</p>
            <a href={home.feature.buttonHref} className="btn btn-primary">
              {home.feature.buttonLabel}
            </a>
          </div>
        </section>

        {/* ---------- LATEST STORIES ---------- */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-header reveal">
              <h2 className="section-title">{sec.storiesTitle}</h2>
              <p className="section-subtitle">{sec.storiesSubtitle}</p>
            </div>
            <div className="story-grid">
              {props.featured.map((s) => (
                <a className="story-card reveal" href={`${s.slug}.html`} key={s.slug}>
                  {s.heroImage && (
                    <div className="story-img-wrapper">
                      <img className="story-img" src={asset(s.heroImage)} alt={s.title} loading="lazy" />
                    </div>
                  )}
                  <div className="story-card-body">
                    {s.date && <div className="story-card-date">{s.date}</div>}
                    <div className="story-card-title">{s.title}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="stories-cta reveal">
              <a href="stories.html" className="btn btn-outline-primary">
                {sec.storiesButtonLabel}
              </a>
            </div>
          </div>
        </section>

        {/* ---------- CTA ---------- */}
        <section className="section cta-section" id="connect">
          <div className="container">
            <div className="cta reveal">
              <h2>{home.cta.title}</h2>
              <p>{home.cta.text}</p>
              <div className="btn-group">
                {home.cta.buttons?.map((b: any, i: number) => (
                  <a href={b.href} className={`btn ${b.outline ? 'btn-outline' : 'btn-primary'}`} key={i}>
                    {b.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const home = getHome();
  const all = listStoriesMeta();
  const featured = (home.featuredStories || [])
    .map((slug: string) => all.find((s) => s.slug === slug))
    .filter(Boolean)
    .slice(0, 3);
  return {
    props: {
      site: getSite(),
      data: { home },
      query: HOME_QUERY,
      variables: { relativePath: 'home.json' },
      featured,
    },
  };
}
