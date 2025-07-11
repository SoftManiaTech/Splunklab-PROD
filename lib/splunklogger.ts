import { getSession } from "next-auth/react";
import { event as sendToGA4 } from "@/lib/gtag";

export const logToSplunk = async ({
  session = "guest-session",
  action,
  details = {},
}: {
  session?: string;
  action: string;
  details?: Record<string, any>;
}) => {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const { ip } = await res.json();

    const authSession = await getSession();
    const user = authSession?.user;

    const payload = {
      ip,
      session: user?.email || session || "guest-session",
      action,
      browser: navigator.userAgent,
      name: user?.name || null,
      email: user?.email || null,
      timestamp: new Date().toISOString(),
      ...details,
    };

    // ✅ 1. Send to Splunk
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // ✅ 2. Send to GA4 (custom event)
    sendToGA4({
      action, // GA event name (e.g. "download_pem", "start_instance")
      params: {
        session: user?.email || session || "guest-session",
        ip,
        name: user?.name || "unknown",
        email: user?.email || "unknown",
        browser: navigator.userAgent,
        ...details,
      },
    });
  } catch (err) {
    console.error("Log failed:", err);
  }
};
