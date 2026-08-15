/**
 * Renders a Tina rich-text body inside .page-content, mapping the custom
 * block templates (tina/templates.ts) to the site's museum-styled markup.
 */
import React from 'react';
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

const heading = (Tag: any) => (props: any) => <Tag id={slugId(props?.children)}>{props?.children}</Tag>;

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
