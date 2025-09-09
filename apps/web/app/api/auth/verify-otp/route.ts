import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const body = await req.text()
  // call backend verify-otp and forward set-cookie header to client
  const r = await fetch(`${API}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
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
