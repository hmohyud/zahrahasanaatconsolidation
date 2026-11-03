import React from 'react';
import { asset } from '../lib/url';

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  heroImage,
  heroFocus,
  vivid,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  heroImage?: string | null;
  /** background-position for the photo, e.g. "50% 10%" to keep its top in view */
  heroFocus?: string | null;
  /** show the photo (lighter wash, taller band) instead of using it as dark texture */
  vivid?: boolean;
}) {
  const cls = heroImage
    ? `page-hero page-hero--image${vivid ? ' page-hero--vivid' : ''}`
    : 'page-hero';
  const style = heroImage
    ? ({
        ['--hero-img' as any]: `url("${asset(heroImage)}")`,
        ...(heroFocus ? { ['--hero-pos' as any]: heroFocus } : {}),
      } as React.CSSProperties)
    : undefined;
  return (
    <section className={cls} style={style}>
      <div className="page-hero-bg"></div>
      <div className="container">
        <div className="page-hero-inner">
          {eyebrow && <h5>{eyebrow}</h5>}
          <div className="hero-divider"></div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}
