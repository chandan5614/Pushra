import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const body = await req.text()
  const r = await fetch(`${API}/admin/orders/${params.id}/assign`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
    body,
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}

