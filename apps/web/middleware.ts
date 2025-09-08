import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminRoute = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (!isAdminRoute) return NextResponse.next()

  // Accept either 'access_token' (API cookie) or 'auth_token'
  const token = req.cookies.get('access_token')?.value || req.cookies.get('auth_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    // Decode without verification for gating (routing only)
    const [, payloadB64] = token.split('.')
    const json = Buffer.from(payloadB64 || '', 'base64url').toString('utf8')
    const payload = JSON.parse(json || '{}')
    const email = payload?.email as string | undefined
    if (!email) throw new Error('no email')
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase())
    if (!admins.includes(email.toLowerCase())) throw new Error('not admin')
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = { matcher: ['/admin/:path*'] }
