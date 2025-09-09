import { API_BASE_URL } from '@/lib/api'

async function getTracking(code: string) {
  const res = await fetch(`${API_BASE_URL}/tracking/${code}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export default async function TrackingPage({ params }: { params: { code: string } }) {
  const data = await getTracking(params.code)
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="font-serif text-3xl">Delivery Tracking</h1>
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <div>Status</div>
          <div className="font-medium">{data.status}</div>
        </div>
        {data.courier?.name && (
          <div className="flex items-center justify-between mt-2">
            <div>Courier</div>
            <div>
              {data.courier.name} {data.courier.phone ? `(${data.courier.phone})` : ''}
            </div>
          </div>
        )}
        {data.proofPhotoUrl && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.proofPhotoUrl} alt="Proof" className="rounded-xl" />
          </div>
        )}
      </div>
      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="font-medium">Timeline</h2>
        <ul className="mt-2 space-y-2">
          {data.events.map((e: any, i: number) => (
            <li key={i} className="text-sm flex items-center justify-between">
              <span>{e.type}</span>
              <span className="opacity-70">{new Date(e.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-sm opacity-60">
        This page refreshes on reload; live polling/streaming can be added later.
      </p>
    </div>
  )
}

