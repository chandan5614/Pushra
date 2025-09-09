import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const r = await fetch(`${API}/admin/couriers`, {
    headers: { cookie: req.headers.get('cookie') || '' },
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}

export async function POST(req: NextRequest) {
  const API = process.env.API_BASE_URL || 'http://localhost:3001'
  const body = await req.text()
  const r = await fetch(`${API}/admin/couriers`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
    body,
    credentials: 'include',
  })
  const j = await r.text()
  return new NextResponse(j, { status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/json' } })
}

