declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Replace with your real GA4 Measurement ID
export const GA_TRACKING_ID = process.env.G_TAG || "";

/**
 * Sends an event to Google Analytics 4.
 * @param action - The event name.
 * @param params - Custom event parameters.
 */
export const event = ({
  action,
  params,
}: {
  action: string;
  params: Record<string, any>;
}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    const sanitizedParams: Record<string, string | number | boolean | null> = {};

    for (const key in params) {
      const value = params[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        sanitizedParams[key] = value;
      }
    }

    window.gtag("event", action, sanitizedParams);
    console.log(`[GA4] Event: ${action}`, sanitizedParams);
  } else {
    console.warn("[GA4] gtag not initialized or unavailable.");
  }
};
