import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const body = await req.text()
  const r = await fetch(`${API}/admin/slots`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, {
    status: r.status,
    headers: { 'content-type': r.headers.get('content-type') || 'application/json' },
  })
}
