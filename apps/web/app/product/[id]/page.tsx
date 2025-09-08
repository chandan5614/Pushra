import Link from 'next/link'

async function getProduct(id: string) {
  const base = process.env.API_BASE_URL || 'http://localhost:3001'
  const res = await fetch(`${base}/products/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)
  if (!product) return <div>Not found</div>
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="aspect-square bg-gray-200 rounded" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold mb-2">{product.name}</h1>
        <div className="mb-4 text-gray-600">Choose a variant:</div>
        <ul className="space-y-2">
          {product.variants?.map((v: any) => (
            <li key={v.id} className="flex items-center justify-between border rounded p-3 bg-white">
              <div>
                <div className="font-medium">{v.title}</div>
                <div className="text-sm text-gray-600">{(v.priceCents/100).toFixed(2)} {v.currency}</div>
              </div>
              <button className="px-3 py-2 rounded bg-black text-white" onClick={async()=>{
                const cart = JSON.parse(localStorage.getItem('cart')||'[]')
                cart.push({ variantId: v.id, quantity: 1 })
                localStorage.setItem('cart', JSON.stringify(cart))
                alert('Added to cart')
              }}>Add</button>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/cart" className="underline">Go to cart</Link>
        </div>
      </div>
    </div>
  )
}

