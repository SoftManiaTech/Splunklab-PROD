import Salesiq from "@/components/salesiq"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
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
            <CardHeader className="text-center bg-slate-900 text-white rounded-t-lg">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">Terms of Use</CardTitle>
              <p className="text-slate-200">Effective Date: June 23, 2025</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Purpose of Service</h2>
                <p className="text-slate-700 leading-relaxed">
                  We provide virtual lab environments with pre-installed Splunk (Free/Trial license) for learning,
                  research, and personal development only. We do not resell or sublicense Splunk software.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Software Licensing</h2>
                <p className="text-slate-700 leading-relaxed">
                  Splunk is a registered trademark of Splunk Inc. Software used is under Splunk's Free or Trial license.
                  Users must adhere to Splunk's EULA.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Educational Use Only</h2>
                <p className="text-slate-700 leading-relaxed">
                  Service intended only for educational purposes. Use for production workloads is prohibited.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Billing & Usage</h2>
                <p className="text-slate-700 leading-relaxed">
                  Charges are for infrastructure, not software. Lab servers expire based on package time.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. User Responsibility</h2>
                <p className="text-slate-700 leading-relaxed">
                  Use ethically. No misuse of servers. Violations may lead to suspension.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Support & Contact</h2>
                <p className="text-slate-700 leading-relaxed">labsupport@softmania.in | +91-8317349618</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Acknowledgment</h2>
                <p className="text-slate-700 leading-relaxed">
                  By using this service, you agree to these terms and Splunk's license policies.
                </p>
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
