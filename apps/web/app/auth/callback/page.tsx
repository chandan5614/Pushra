'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [msg, setMsg] = useState('Signing you in...')
  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setMsg('Missing token')
      return
    }
    (async function run() {
      const res = await fetch(`/api/auth/callback?token=${encodeURIComponent(token)}`)
      const j = await res.json()
      if (j?.ok) {
        setMsg('Signed in ✔')
        setTimeout(() => router.replace('/'), 600)
      } else setMsg('Failed to sign in')
    })()
  }, [params, router])
  return <div className="text-gray-700">{msg}</div>
}
