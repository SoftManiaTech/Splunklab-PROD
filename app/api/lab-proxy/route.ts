// app/api/lab-proxy/route.ts

import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export async function POST(req: NextRequest) {
  try {
    const { path, method = "GET", body } = await req.json();
    const userEmail = req.headers.get("x-user-email") || "unknown";

    const targetUrl = `${API_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userEmail}`,
      },
      body: method !== "GET" ? JSON.stringify(body || {}) : undefined,
    };

    const res = await fetch(targetUrl, options);
    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error("Proxy error:", err.message);
    return NextResponse.json(
      { error: "Proxy request failed" },
      { status: 500 }
    );
  }
}
