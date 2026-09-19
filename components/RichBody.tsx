/**
 * Renders a Tina rich-text body inside .page-content, mapping the custom
 * block templates (tina/templates.ts) to the site's museum-styled markup.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TinaMarkdown, TinaMarkdownContent } from 'tinacms/dist/rich-text';
import { asset } from '../lib/url';


/** Slug ids for headings so in-page anchors like #food work. */
function textOfNode(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(textOfNode).join('');
  if (typeof node === 'object') {
    // Tina AST text node
    if (typeof node.text === 'string') return node.text;
    // Tina AST element node
    if (node.children) return textOfNode(node.children);
    // rendered React element (Tina nests children under props.children or
    // hands the raw AST to an inner renderer as props.content)
    if (node.props) return textOfNode(node.props.children ?? node.props.content);
  }
  return '';
}
function slugId(children: any): string | undefined {
  const t = textOfNode(children).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return t || undefined;
}

/** Every image node inside a rich-text subtree, in document order. */
function collectImages(node: any, out: any[] = []): any[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((n) => collectImages(n, out));
    return out;
  }
  if (node.type === 'img' && node.url) out.push({ url: node.url, alt: node.alt || '' });
  if (node.children) collectImages(node.children, out);
  return out;
}

const heading = (Tag: any) => (props: any) => <Tag id={slugId(props?.children)}>{props?.children}</Tag>;


/**
 * Sliding gallery. The track is a native scroll-snap container (so touch
 * swiping and no-JS both work); React adds arrows, dots and keyboard control.
 */
function CarouselBlock({ slides, variant }: { slides: any[]; variant?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector('.carousel-slide') as HTMLElement | null;
    const w = slide?.getBoundingClientRect().width || 1;
    setIndex(Math.round(el.scrollLeft / w));
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', sync);
    sync();
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sync]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const slide = el.querySelector('.carousel-slide') as HTMLElement | null;
    const w = slide?.getBoundingClientRect().width || 1;
    const target = Math.max(0, Math.min(i, slides.length - 1));
    el.scrollTo({ left: target * w, behavior: 'smooth' });
  };

  return (
    <div className={`carousel${variant === 'quotes' ? ' carousel--quotes' : ''}`}>
      <div
        className="carousel-track"
        ref={trackRef}
        tabIndex={0}
        aria-label="Image gallery"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            goTo(index + 1);
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goTo(index - 1);
          }
        }}
      >
        {slides.map((s: any, i: number) => (
          <figure className="carousel-slide" key={i}>
            <img src={asset(s.url)} alt={s.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            {s.alt && <figcaption>{s.alt}</figcaption>}
          </figure>
        ))}
      </div>
      <button
        className="carousel-nav carousel-prev"
        type="button"
        aria-label="Previous image"
        disabled={atStart}
        onClick={() => goTo(index - 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
          <path d="M15 5L8 12l7 7" />
        </svg>
      </button>
      <button
        className="carousel-nav carousel-next"
        type="button"
        aria-label="Next image"
        disabled={atEnd}
        onClick={() => goTo(index + 1)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="carousel-dots">
        {slides.map((_: any, i: number) => (
          <button
            key={i}
            type="button"
            className={`carousel-dot${i === index ? ' active' : ''}`}
            aria-label={`Go to image ${i + 1}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

const components = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
  h5: heading('h5'),
  h6: heading('h6'),
  MediaText: (props: any) => (
    <div className={`media-row${props?.mediaRight ? ' media-row--right' : ''}`}>
      {props?.image && (
        <figure className="media-row-media">
          <img src={asset(props.image)} alt={props?.alt || ''} loading="lazy" />
        </figure>
      )}
      <div className="media-row-body">
        <TinaMarkdown content={props?.children} components={components as any} />
      </div>
    </div>
  ),
  CoverCard: (props: any) => (
    <div className="highlight-card">
      <TinaMarkdown content={props?.children} components={components as any} />
    </div>
  ),
  Gallery: (props: any) => (
    <div className="img-gallery">
      <TinaMarkdown content={props?.children} components={components as any} />
    </div>
  ),
  Carousel: (props: any) => {
    const slides = collectImages(props?.children);
    if (!slides.length) return null;
    return <CarouselBlock slides={slides} variant={props?.variant} />;
  },
  PortalEmbed: (props: any) => (
    <div className="portal-embed">
      <div className="portal-embed-bar">
        <span>{props?.title || 'Application portal'}</span>
        <a href={props?.url} target="_blank" rel="noopener noreferrer">
          Open in a new tab &#8599;
        </a>
      </div>
      <iframe
        src={props?.url}
        title={props?.title || 'Application portal'}
        style={props?.minHeight ? { minHeight: props.minHeight } : undefined}
        loading="lazy"
      />
    </div>
  ),
  Embed: (props: any) => (
    <div
      className="video-embed"
      style={props?.aspect ? { aspectRatio: `100 / ${props.aspect}` } : undefined}
    >
      <iframe src={props?.url} title={props?.title || 'Embedded content'} allowFullScreen />
    </div>
  ),
  VideoFile: (props: any) => (
    <figure className="video-figure">
      <video controls preload="none" poster={props?.poster || undefined} src={props?.src} style={{ width: '100%' }} />
    </figure>
  ),
  ButtonRow: (props: any) => (
    <div className="btn-row">
      <TinaMarkdown content={props?.children} components={components as any} />
    </div>
  ),
  ContactCard: (props: any) => {
    const rows: [string, React.ReactNode][] = [];
    if (props?.email)
      rows.push(['Email', <a href={`mailto:${props.email}`}>{props.email}</a>]);
    if (props?.phone)
      rows.push([
        'Phone',
        <>
          <a href={`tel:${String(props.phone).replace(/[^\d+]/g, '')}`}>{props.phone}</a>
          {props?.hours && <span className="contact-hours">{props.hours}</span>}
        </>,
      ]);
    if (props?.address)
      rows.push([
        'Address',
        <span className="contact-address">{props.address}</span>,
      ]);
    if (!rows.length) return null;
    return (
      <div className="contact-card">
        {props?.heading && <h3 className="contact-card-heading">{props.heading}</h3>}
        <dl className="contact-rows">
          {rows.map(([label, value]) => (
            <div className="contact-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {props?.note && <p className="contact-note">{props.note}</p>}
      </div>
    );
  },
  /* Arabic is cursive, so the drop cap on the opening paragraph mangles it —
     ::first-letter detaches the leading letter and it loses its joined form.
     Mark those paragraphs so the CSS can opt them out and set them in the
     display size used for scripture elsewhere on the site. */
  p: (props: any) => {
    const text = textOfNode(props?.children).replace(/\s/g, '');
    const arabic = (text.match(/[؀-ۿ]/g) || []).length;
    return <p className={arabic > text.length * 0.5 ? 'arabic-line' : undefined}>{props?.children}</p>;
  },
  img: (props: any) => <img src={asset(props?.url)} alt={props?.alt || ''} loading="lazy" />,
  a: (props: any) =>
    /^https?:\/\//.test(props?.url || '') ? (
      <a href={props.url} target="_blank" rel="noopener noreferrer">
        {props.children}
      </a>
    ) : (
      <a href={props?.url}>{props.children}</a>
    ),
  html: (props: any) => <div dangerouslySetInnerHTML={{ __html: props?.value || '' }} />,
  html_inline: (props: any) => <span dangerouslySetInnerHTML={{ __html: props?.value || '' }} />,
};

export default function RichBody({ content }: { content: TinaMarkdownContent }) {
  return <TinaMarkdown content={content} components={components as any} />;
}
