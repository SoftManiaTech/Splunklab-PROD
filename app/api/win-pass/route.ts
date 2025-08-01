import { type NextRequest, NextResponse } from "next/server"

// Assuming your backend API URL is stored in NEXT_PUBLIC_API_URL
const BACKEND_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(request: NextRequest) {
  try {
    const { instance_id, email } = await request.json()

    if (!instance_id || !email) {
      return NextResponse.json({ message: "Missing instance_id or email" }, { status: 400 })
    }

    // Construct the full backend API endpoint for getting Windows password
    const backendUrl = `${BACKEND_API_BASE_URL}/win-pass`

    // Forward the request to your actual backend API
    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the user email as a custom header if your backend expects it
        "x-user-email": email,
      },
      body: JSON.stringify({ instance_id, email }), // Send instance_id and email to backend
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      console.error("Backend error fetching Windows password:", errorData)
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch password from backend" },
        { status: backendResponse.status },
      )
    }

    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in /api/win-pass route:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
