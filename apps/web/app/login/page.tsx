'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Sending...')
    const res = await fetch('/api/auth/magiclink', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setMsg(data?.message || 'Check your inbox')
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Sending OTP...')
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    setMsg(data?.message || 'Sent')
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Verifying...')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    const data = await res.json()
    if (data?.ok) setMsg('Logged in')
    else setMsg('Failed')
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={sendMagicLink} className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Login with email</h2>
        <input
          className="w-full border rounded px-3 py-2 mb-3"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-black text-white">Send magic link</button>
      </form>
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Login with phone (OTP)</h2>
        <form onSubmit={sendOtp} className="mb-3">
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="+971..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button className="px-3 py-2 rounded bg-black text-white">Send OTP</button>
        </form>
        <form onSubmit={verifyOtp}>
          <input
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="px-3 py-2 rounded bg-black text-white">Verify</button>
        </form>
      </div>
      {msg && <div className="md:col-span-2 text-sm text-gray-600">{msg}</div>}
    </div>
  )
}
