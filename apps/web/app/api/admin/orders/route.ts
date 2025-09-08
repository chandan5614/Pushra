import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const r = await fetch(`${API}/admin/orders`, {
    headers: { cookie: req.headers.get('cookie') || '' },
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}

