import { Html, Head, Main, NextScript } from "next/document";
import { GA_TRACKING_ID } from "@/lib/gtag";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Open Graph Metadata */}
        <meta
          property="og:title"
          content="Splunk Lab - Soft Mania | Budget-Friendly Splunk Environments"
        />
        <meta
          property="og:description"
          content="Launch and manage Standalone, Distributed, and Clustered Splunk labs within your budget and timeframe. Splunk Lab - Soft Mania offers quick, cost-effective deployment solutions for learning, development, and testing."
        />
        <meta
          property="og:image"
          content="https://splunklab.softmania.in/Splunk-Lab-Wizard.png"
        />
        <meta property="og:url" content="https://splunklab.softmania.in" />
        <meta property="og:type" content="website" />

        <link rel="canonical" href="https://splunklab.softmania.in" />
        <link rel="author" href="https://softmania.in" />
        <link
          rel="me"
          href="https://www.linkedin.com/company/softmania-tech/"
        />
        <link rel="me" href="https://www.instagram.com/softmaniatech/" />
        <link rel="me" href="https://www.youtube.com/@SoftManiaTech" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
