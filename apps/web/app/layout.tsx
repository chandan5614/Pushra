import './globals.css'
import Link from 'next/link'
import { cookies } from 'next/headers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(cookies().get('access_token'))
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">
              Pushra
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/cart">Cart</Link>
              {hasToken ? (
                <div className="relative group">
                  <button className="px-3 py-1 rounded bg-gray-100">Account ▾</button>
                  <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded shadow p-2">
                    <Link href="/admin" className="block px-3 py-1 hover:bg-gray-50">
                      Admin
                    </Link>
                  </div>
                </div>
              ) : (
                <Link href="/login">Login</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
