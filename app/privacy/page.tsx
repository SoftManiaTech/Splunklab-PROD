import Salesiq from "@/components/salesiq"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <>
    <Salesiq />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center bg-green-600 text-white rounded-t-lg">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Privacy Policy</CardTitle>
              <p className="text-green-100">Effective Date: June 23, 2025</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Information We Collect</h2>
                <ul className="text-slate-700 leading-relaxed space-y-2">
                  <li>• Name, Email, Phone, Payment info (via third-party)</li>
                  <li>• IP address, session logs</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Use of Information</h2>
                <ul className="text-slate-700 leading-relaxed space-y-2">
                  <li>• To deliver and manage lab services</li>
                  <li>• To improve performance and communicate updates</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Payment Information</h2>
                <p className="text-slate-700 leading-relaxed">
                  All payments are handled via Razorpay/UPI. We do not store full payment details.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Data Security</h2>
                <p className="text-slate-700 leading-relaxed">
                  We apply best practices to protect data but cannot guarantee 100% security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Communication</h2>
                <p className="text-slate-700 leading-relaxed">
                  You agree to receive lab and service-related messages via email/WhatsApp.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Data Retention</h2>
                <p className="text-slate-700 leading-relaxed">
                  Lab data is auto-deleted after session ends. Logs retained for up to 90 days.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Third-Party Tools</h2>
                <p className="text-slate-700 leading-relaxed">
                  We use Razorpay, Google Analytics, etc., governed by their policies.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Your Rights</h2>
                <p className="text-slate-700 leading-relaxed">Request access, deletion, or opt-out by contacting us.</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact</h2>
                <p className="text-slate-700 leading-relaxed">labsupport@softmania.in | +91-8317349618</p>
              </div>

              <div className="border-t pt-8 mt-8 text-center">
                <p className="text-slate-600">
                  Soft Mania | labsupport@softmania.in | +91-8317349618 | www.softmania.in
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  )
}

