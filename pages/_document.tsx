import { Html, Head, Main, NextScript } from 'next/document';

const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* keep the private preview out of search engines */}
        <meta name="robots" content="noindex, nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* shared vanilla behaviors (nav, reveal, lightbox…) — reruns per page load */}
        <script defer src={`${bp}/site.js`} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
