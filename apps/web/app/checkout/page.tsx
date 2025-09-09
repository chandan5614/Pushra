"use client"
import { useCallback, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../lib/api'

export default function CheckoutPage() {
  const [message, setMessage] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const cart = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  }, [])
  const slotId = useMemo(() => localStorage.getItem('slotId') || '', [])
  const city = useMemo(() => localStorage.getItem('city') || 'al-ain', [])

  const init = useCallback(async (providerOverride?: 'test') => {
    setBusy(true)
    setMessage('Initializing payment...')
    try {
      const idempotencyKey = crypto.randomUUID()
      const url = new URL(`${API_BASE_URL}/checkout/init`)
      if (providerOverride) url.searchParams.set('provider', providerOverride)
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cart: { items: cart.map((i:any)=>({ variantId: i.variantId, qty: i.quantity })) }, slotId, city, idempotencyKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Checkout init failed')

      if (data.provider === 'paytabs' && data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      if (data.provider === 'stripe' && data.clientSecret) {
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!pk) {
          console.warn('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; simulating success')
          window.location.href = '/checkout/success'
          return
        }
        const { loadStripe } = await import('@stripe/stripe-js')
        const stripe = await loadStripe(pk)
        if (!stripe) throw new Error('Stripe failed to load')
        // In a real flow, you would collect card details via Elements. For stub, confirm without payment method.
        const result = await stripe.retrievePaymentIntent(data.clientSecret)
        if (result.error) throw new Error(result.error.message)
        window.location.href = '/checkout/success'
        return
      }
      if (data.provider === 'test' && data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      setMessage('No supported provider response.');
    } catch (e:any) {
      console.error(e)
      setMessage(e?.message || 'Checkout failed')
      // Attempt to release slot if we have an order code
      try {
        const orderCode = localStorage.getItem('orderCode')
        if (orderCode) {
          await fetch(`${API_BASE_URL}/slots/release`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderCode }) })
        }
      } catch (e) { console.warn('slot release failed') }
    } finally {
      setBusy(false)
    }
  }, [cart, slotId, city])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <div className="text-sm text-gray-600">Cart items: {cart.length} • Slot: {slotId ? 'selected' : 'not selected'}</div>
      {message && <div className="text-sm text-red-600">{message}</div>}
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={busy || !slotId || cart.length===0} onClick={()=>init()}>Pay by Card</button>
        <button className="px-4 py-2 rounded bg-gray-800 text-white disabled:opacity-50" disabled={busy || !slotId || cart.length===0} onClick={()=>init('test')}>Test Pay</button>
      </div>
    </div>
  )
}
