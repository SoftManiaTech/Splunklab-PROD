import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta property="og:title" content="Splunk Lab – Soft Mania" />
        <meta property="og:description" content="Quickly deploy cost-effective Splunk labs..." />
        <meta property="og:image" content="https://splunklab.softmania.in/og-cover.png" />
        <meta property="og:url" content="https://splunklab.softmania.in" />
        <meta property="og:type" content="website" />

        <link rel="canonical" href="https://splunklab.softmania.in" />
        <link rel="author" href="https://softmania.in" />
        <link rel="me" href="https://www.linkedin.com/company/softmania-tech/" />
        <link rel="me" href="https://www.instagram.com/softmaniatech/" />
        <link rel="me" href="https://www.youtube.com/@SoftManiaTech" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
