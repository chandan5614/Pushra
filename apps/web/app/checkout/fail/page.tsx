"use client"
import { useSearchParams } from 'next/navigation'

export default function CheckoutFail() {
  const params = useSearchParams()
  const reason = params.get('reason') || 'unknown'
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Payment failed</h1>
      <p className="text-gray-600">Reason: {reason}</p>
      <a href="/checkout" className="underline">
        Try again
      </a>
    </div>
  )
}
