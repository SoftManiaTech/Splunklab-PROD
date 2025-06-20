import { Suspense } from 'react'
import ThankYouClient from './client-page'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <Suspense fallback={<p className="text-gray-600">Loading...</p>}>
        <ThankYouClient />
      </Suspense>
    </div>
  )
}
