import Link from "next/link"
import { SoftmaniaLogo } from "@/components/softmania-logo"

export function LabFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 sm:gap-8">
          {/* Top Section: Logo + Copyright */}
          <div className="flex flex-col items-center gap-2 text-center">
            <SoftmaniaLogo size="sm" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} SoftMania. All rights reserved.
            </p>
          </div>

          {/* Middle Section: Links */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/refund" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Refund Policy
            </Link>
          </div>

          {/* Bottom Section: Professional Disclaimer */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-50 dark:bg-red-800 rounded-lg p-4 sm:p-6 border border-red-400 dark:border-red-700">
              <h4 className="text-sm font-semibold text-red-700 dark:text-white mb-2">
                Independent Service Disclaimer
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                SoftMania operates as an independent infrastructure service provider. We have no contractual agreements,
                partnerships, or business relationships with Splunk Inc. Our service provides cloud infrastructure with
                pre-installed Splunk software under Splunk's Free or Trial license terms. Splunk® is a registered
                trademark of Splunk Inc. All Splunk-related trademarks and intellectual property belong to their
                respective owners. This service is intended solely for educational and learning purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
