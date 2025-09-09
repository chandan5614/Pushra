'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getJSON } from '../../../lib/api'

export default function CheckoutSuccess() {
  const params = useSearchParams()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    const c = params.get('code') || params.get('pid') || ''
    setCode(c)
    if (!c) return
    let tries = 0
    let t: any
    const poll = async () => {
      tries++
      try {
        const res = await getJSON(`/orders/status?code=${encodeURIComponent(c)}`)
        const s = res?.order?.paymentStatus || res?.order?.status || 'pending'
        setStatus(String(s))
      } catch (e) {
        // ignore transient failures while polling
      }
      if (tries < 10) t = setTimeout(poll, 2000)
    }
    poll()
    return () => clearTimeout(t)
  }, [params])

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <p className="text-gray-600">
        Order code: <span className="font-mono">{code || '(unknown)'}</span>
      </p>
      <p className="text-gray-600">
        Status: <span className="font-mono">{status}</span>
      </p>
      <a href="/" className="underline">
        Back to home
      </a>
    </div>
  )
}
