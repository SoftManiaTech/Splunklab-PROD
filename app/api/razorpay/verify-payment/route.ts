import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    const sign = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex")

    if (razorpay_signature === expectedSign) {
      return NextResponse.json({ message: "Payment verified successfully" })
    } else {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json({ message: "Error verifying payment" }, { status: 500 })
  }
}
