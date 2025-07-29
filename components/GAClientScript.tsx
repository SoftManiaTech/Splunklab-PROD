"use client";

import { useEffect } from "react";
import { GA_TRACKING_ID } from "@/lib/gtag";

export default function GAClientScript() {
  useEffect(() => {
    if (!GA_TRACKING_ID) return;

    const script1 = document.createElement("script");
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
    script1.async = true;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_TRACKING_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);
  }, []);

  return null;
}
