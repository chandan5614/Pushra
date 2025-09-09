"use client"
import { useEffect, useState } from 'react'

export default function AdminDeliveryDetail({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    ;(async () => {
      const r = await fetch(`/api/admin/deliveries/${params.id}`, { cache: 'no-store' })
      if (r.ok) setData(await r.json())
      else setErr('Failed to load')
    })()
  }, [params.id])

  if (err) return <div className="text-red-600 text-sm">{err}</div>
  if (!data) return <div className="text-sm text-gray-600">Loading…</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Delivery</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-3">
          <div className="text-sm">
            <div><span className="text-gray-500">ID:</span> <span className="font-mono">{data.id}</span></div>
            <div><span className="text-gray-500">Code:</span> <span className="font-mono">{data.code}</span></div>
            <div><span className="text-gray-500">Status:</span> {data.status}</div>
            {data.recipientName && <div><span className="text-gray-500">Recipient:</span> {data.recipientName}</div>}
          </div>
        </div>
        <div className="bg-white border rounded p-3">
          <div className="text-sm font-medium mb-2">Proof Photo</div>
          {data.proofPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.proofPhotoUrl} alt="proof" className="max-w-full rounded border" />
          ) : (
            <div className="text-sm text-gray-500">No photo</div>
          )}
        </div>
      </div>
      <div className="bg-white border rounded p-3">
        <div className="text-sm font-medium mb-2">Events</div>
        <ul className="text-sm space-y-1">
          {data.events?.map((e: any, idx: number) => (
            <li key={idx} className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-500">{new Date(e.createdAt || e.at).toLocaleString()}</span>
              <span>{e.type}</span>
              <span className="text-gray-500">{e.note || ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

