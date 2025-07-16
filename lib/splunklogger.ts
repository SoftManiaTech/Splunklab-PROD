import { getSession } from "next-auth/react";
import { event as sendToGA4 } from "@/lib/gtag";

/**
 * Logs a unified event to Splunk and GA4.
 * @param session - A guest session ID (or overridden value).
 * @param action - The name of the event (e.g. start_instance).
 * @param details - Additional event parameters.
 */
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
    // Get IP
    const res = await fetch("https://api.ipify.org?format=json");
    const { ip } = await res.json();

    // Get user session
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

    // ✅ 2. Send to GA4
    sendToGA4({
      action,
      params: {
        session: payload.session,
        ip,
        name: payload.name || "unknown",
        email: payload.email || "unknown",
        browser: navigator.userAgent,
        ...details,
      },
    });
  } catch (err) {
    console.error("[LogToSplunk] Unified logging failed:", err);
  }
};
