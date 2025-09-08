import Link from 'next/link'

async function getProducts() {
  const base = process.env.API_BASE_URL || 'http://localhost:3001'
  const res = await fetch(`${base}/products`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const products = await getProducts()
  return (
    <div>
      <section className="py-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome to Pushra</h1>
        <p className="text-gray-600">Fresh snacks delivered in time slots.</p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Featured products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p: any) => (
            <Link key={p.id} href={`/product/${p.id}`} className="block border rounded p-4 bg-white hover:shadow">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.variants?.length || 0} variant(s)</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

