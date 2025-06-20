'use client'

import { useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ThankYouPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [showPopup, setShowPopup] = useState(true)

  return (
    <Dialog open={showPopup} onOpenChange={setShowPopup}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2 text-xl">
            <CheckCircle className="w-5 h-5" />
            Payment Successful!
          </DialogTitle>
          <p className="text-gray-700 dark:text-gray-300 text-sm mt-2 leading-relaxed">
            Your lab setup ticket has been created.<br />
            Please check your email <strong>({email})</strong> for confirmation.<br />
            Your lab will be delivered within <strong>4–5 business hours</strong><br />
            <span className="text-gray-500">(Business hours: 10 AM – 6 PM IST)</span>
          </p>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
