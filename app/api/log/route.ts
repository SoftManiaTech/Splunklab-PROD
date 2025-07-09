// app/api/log/route.ts
import { NextRequest, NextResponse } from "next/server";

// Use the correct port and endpoint
const SPLUNK_HEC_URL = `${process.env.SPLUNK_HEC_URL}` ;
const SPLUNK_TOKEN = `${process.env.SPLUNK_TOKEN}`; 

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      time: Math.floor(Date.now() / 1000),
      host: "nextjs-client",
      source: "nextjs-api-proxy",
      sourcetype: "_json",
      event: {
        ip: body.ip || "unknown",
        session: body.session || "no-session",
        action: body.event || "no-event",
        browser: body.browser || "unknown",
        timestamp: new Date().toISOString(),
        extra: body.extra || {},
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
      return new NextResponse(`Logging failed: ${errorText}`, { status: 500 });
    }

    return new NextResponse("✅ Logged to Splunk via API", { status: 200 });
  } catch (error: any) {
    return new NextResponse(`Logging failed: ${error.message}`, { status: 500 });
  }
}
