"use client"
import { useEffect, useState } from 'react'

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([])
  const [email, setEmail] = useState('test@pushra.local')
  const [slotId, setSlotId] = useState('')
  const [slots, setSlots] = useState<any[]>([])
  const [city] = useState('al-ain')
  const [date, setDate] = useState<string>(()=>new Date().toISOString().slice(0,10))
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    const c = JSON.parse(localStorage.getItem('cart')||'[]')
    setCart(c)
  },[])

  useEffect(()=>{
    async function run(){
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3001'
      const res = await fetch(`${base}/slots?date=${date}&city=${city}`)
      if (res.ok) setSlots(await res.json())
    }
    run()
  },[city, date])

  useEffect(()=>{ if (slotId) localStorage.setItem('slotId', slotId) }, [slotId])
  useEffect(()=>{ if (city) localStorage.setItem('city', city) }, [city])

  function goCheckout(){
    setMsg('Proceeding to checkout...')
    window.location.href = '/checkout'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Cart</h1>
      <ul className="space-y-2 mb-6">
        {cart.map((i, idx)=> <li key={idx} className="border rounded p-2 bg-white">{i.variantId} x {i.quantity}</li>)}
      </ul>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-3">
          <label className="block text-sm text-gray-600 mb-1">Email (for guest checkout)</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div className="bg-white border rounded p-3">
          <label className="block text-sm text-gray-600 mb-1">Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <div className="bg-white border rounded p-3">
          <label className="block text-sm text-gray-600 mb-1">Slot</label>
          <select className="w-full border rounded px-3 py-2" value={slotId} onChange={e=>setSlotId(e.target.value)}>
            <option value="">Select a slot</option>
            {slots.map((s:any)=> <option key={s.id} value={s.id}>{s.label} ({s.left} left)</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <button className="px-4 py-2 rounded bg-black text-white" onClick={goCheckout} disabled={!slotId || cart.length===0}>Checkout</button>
      </div>
      {msg && <div className="mt-3 text-sm text-gray-600">{msg}</div>}
    </div>
  )
}
