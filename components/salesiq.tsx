"use client";
import { useEffect } from "react";

const Salesiq = () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.$zoho = window.$zoho || {};
      window.$zoho.salesiq = window.$zoho.salesiq || { ready: function () {} };

      const script = document.createElement("script");
      script.id = "zsiqscript";
      script.src =
        "https://salesiq.zohopublic.in/widget?wc=siqe9fde7d2e5b61f55875db0dbc7de6943d79848355620ac9f700753b8e2f0fe8f";
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return null; // No UI needed, just loads the script
};

export default Salesiq;