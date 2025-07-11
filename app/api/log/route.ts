// app/api/log/route.ts
import { NextRequest, NextResponse } from "next/server";

const SPLUNK_HEC_URL = process.env.SPLUNK_HEC_URL || "";
const SPLUNK_TOKEN = process.env.SPLUNK_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only include name/email for Google login
    const isGoogleLogin = body.event === "google_login";

    const payload: Record<string, any> = {
      time: Math.floor(Date.now() / 1000),
      index: "splunk_lab_wiz",
      host: "userslogs",
      source: "nextjs-api-proxy",
      sourcetype: "_json",
      event: {
        title: body.title || "User Event",
        action: body.action || "unspecified",
        session: body.session || "no-session",
        ip: body.ip || "unknown",
        browser: body.browser || "unknown",
        timestamp: body.timestamp || new Date().toISOString(),

        // Only add name/email if it's a Google login
        ...(isGoogleLogin && {
          name: body.name || "unknown",
          email: body.email || "unknown",
        }),

        // Optional fields for package selection
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.hours !== undefined && { hours: body.hours }),
        ...(body.envTitle !== undefined && { envTitle: body.envTitle }),
      },
    };

    const response = await fetch(SPLUNK_HEC_URL, {
      method: "POST",
      headers: {
        Authorization: `Splunk ${SPLUNK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Splunk HEC error:", errorText);
      return new NextResponse(`Logging failed: ${errorText}`, { status: 500 });
    }

    return new NextResponse("✅ Logged to Splunk via API", { status: 200 });
  } catch (error: any) {
    console.error("Log routing error:", error);
    return new NextResponse(`Logging failed: ${error.message}`, { status: 500 });
  }
}
