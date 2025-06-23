import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function RefundPage() {
  return (
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
            <CardHeader className="text-center bg-red-600 text-white rounded-t-lg">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Refund Policy</CardTitle>
              <p className="text-red-100">Effective Date: June 23, 2025</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. No Refund Policy</h2>
                <p className="text-slate-700 leading-relaxed">
                  Due to the nature of digital lab environments and immediate resource allocation, we operate under a
                  strict no-refund policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Purchase Responsibility</h2>
                <p className="text-slate-700 leading-relaxed">
                  Customers are responsible for selecting the correct lab package and duration. Once a purchase is made,
                  no refunds or exchanges will be provided.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Exceptions</h2>
                <p className="text-slate-700 leading-relaxed">
                  There are no exceptions unless the service is not delivered as described due to technical failure on
                  our end.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Contact</h2>
                <p className="text-slate-700 leading-relaxed">For support or issues, please reach out to:</p>
                <p className="text-slate-700 leading-relaxed font-medium">labsupport@softmania.in | +91-8317349618</p>
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
  )
}
