import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const url = new URL(req.url)
  const city = url.searchParams.get('city') || 'al-ain'
  const r = await fetch(`${API}/admin/slots/calendar?city=${encodeURIComponent(city)}`, {
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  })
}
