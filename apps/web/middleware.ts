import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAdminRoute = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (!isAdminRoute) return NextResponse.next()

  const token = req.cookies.get('access_token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'change-me')
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== 'admin') throw new Error('not admin')
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}

