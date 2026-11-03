import { Html, Head, Main, NextScript } from 'next/document';

const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* keep the private preview out of search engines */}
        <meta name="robots" content="noindex, nofollow" />
        {/* ZH monogram, in the display face and primary green. Without these the
            browser asks for /favicon.ico at the domain root, which 404s. */}
        <link rel="icon" type="image/png" sizes="32x32" href={`${bp}/favicon-32.png`} />
        <link rel="apple-touch-icon" href={`${bp}/apple-touch-icon.png`} />
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
