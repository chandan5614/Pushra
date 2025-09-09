import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const r = await fetch(`${API}/auth/callback?token=${encodeURIComponent(token || '')}`, {
    credentials: 'include',
  })
  const res = new NextResponse(await r.text(), {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  })
  const setCookie = r.headers.get('set-cookie')
  if (setCookie) res.headers.set('set-cookie', setCookie)
  return res
}
