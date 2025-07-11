import { getSession } from "next-auth/react";

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
      ...details, // attach any custom data like instanceId, region etc.
    };

    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Splunk log failed:", err);
  }
};
