import { type NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR" } = await request.json()

    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: true, // ✅ Enable auto-capture
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json({ message: "Error creating order" }, { status: 500 })
  }
}
