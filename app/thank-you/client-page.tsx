'use client'

import { useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ThankYouClient() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || "your email"
  const [open, setOpen] = useState(true)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-green-600 flex items-center gap-2 text-xl">
            <CheckCircle className="w-5 h-5" />
            Payment Successful!
          </DialogTitle>
          <p className="text-gray-700 text-sm mt-2 leading-relaxed">
            Your lab setup ticket has been created.<br />
            Please check your email <strong>({email})</strong> for confirmation.<br />
            Lab will be delivered within <strong>4–5 hours</strong> during <strong>10 AM – 6 PM IST</strong>.
          </p>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
