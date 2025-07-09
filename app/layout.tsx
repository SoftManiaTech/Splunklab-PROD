import type React from "react";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Splunk Lab - Soft Mania | Budget-Friendly Splunk Environments",
  description:
    "Launch and manage Standalone, Distributed, and Clustered Splunk labs within your budget and timeframe. Splunk Lab - Soft Mania offers quick, cost-effective deployment solutions for learning, development, and testing.",
  keywords: [
    "Splunk lab setup",
    "Splunk standalone environment",
    "Splunk clustered deployment",
    "Splunk non-clustered lab",
    "Splunk lab calculator",
    "Splunk on budget",
    "Soft Mania Splunk Lab",
    "Splunk lab automation",
    "Splunk distributed architecture",
    "Splunk training lab setup",
  ],
  authors: [{ name: "Soft Mania" }],
  creator: "Soft Mania",
  metadataBase: new URL("https://softmania.in"),
  alternates: {
    canonical: "https://splunklab.softmania.in",
  },
  openGraph: {
    title: "Splunk Lab - Soft Mania | Budget-Friendly Splunk Environments",
    description:
      "Launch and manage Standalone, Distributed, and Clustered Splunk labs within your budget and timeframe. Splunk Lab - Soft Mania offers quick, cost-effective deployment solutions for learning, development, and testing.",
    url: "https://splunklab.softmania.in",
    siteName: "Splunk Lab - Soft Mania",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://splunklab.softmania.in/Splunk-Lab-Wizard.png",
        width: 1200,
        height: 630,
        alt: "Splunk Lab - Soft Mania Open Graph Preview",
      },
    ],
  },
  other: {
    "official:website": "https://softmania.in",
    "linkedin:company": "https://www.linkedin.com/company/softmania-tech/",
    "instagram:profile": "https://www.instagram.com/softmaniatech/",
    "youtube:channel": "https://www.youtube.com/@SoftManiaTech",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* ✅ Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-WHVVB84Z78"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-WHVVB84Z78', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
      {/* Version Label Fixed at Bottom Right */}
      <div className="fixed bottom-4 left-4 z-50 text-xs text-gray-500 bg-white/80 border border-gray-200 px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
        V1.4.2
      </div>
    </html>
  );
}
