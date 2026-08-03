import React from 'react';
import { asset } from '../lib/url';

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  heroImage,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  heroImage?: string | null;
}) {
  const cls = heroImage ? 'page-hero page-hero--image' : 'page-hero';
  const style = heroImage
    ? ({ ['--hero-img' as any]: `url("${asset(heroImage)}")` } as React.CSSProperties)
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
