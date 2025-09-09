'use client'
import { useEffect, useMemo, useState } from 'react'

type Order = { id: string; status: string; createdAt: string }

const uiCols = ['NEW', 'PREPARING', 'OUT', 'DELIVERED'] as const
type UiStatus = (typeof uiCols)[number]

function mapFromServer(s: string): UiStatus {
  if (s === 'CONFIRMED' || s === 'PENDING') return 'NEW'
  if (s === 'PREPARING') return 'PREPARING'
  if (s === 'DISPATCHED') return 'OUT'
  return 'DELIVERED'
}
function mapToServer(s: UiStatus): string {
  if (s === 'NEW') return 'CONFIRMED'
  if (s === 'OUT') return 'DISPATCHED'
  return s
}

const SLA: Record<UiStatus, number> = {
  NEW: 30,
  PREPARING: 60,
  OUT: 120,
  DELIVERED: 0,
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [couriers, setCouriers] = useState<Array<{ id: string; name: string }>>([])
  const [assigned, setAssigned] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/admin/orders', { cache: 'no-store' })
    if (res.ok) setOrders(await res.json())
  }
  useEffect(() => {
    load()
    ;(async () => {
      const r = await fetch('/api/admin/couriers', { cache: 'no-store' })
      if (r.ok) setCouriers(await r.json())
    })()
  }, [])

  const grouped = useMemo(() => {
    const g: Record<UiStatus, Order[]> = { NEW: [], PREPARING: [], OUT: [], DELIVERED: [] }
    for (const o of orders) g[mapFromServer(o.status)].push(o)
    return g
  }, [orders])

  function onDragStart(id: string) {
    return () => setDragId(id)
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
  }
  async function onDrop(target: UiStatus) {
    if (!dragId) return
    const newStatus = mapToServer(target)
    const res = await fetch(`/api/admin/orders/${dragId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) await load()
    setDragId(null)
  }

  function Age({ createdAt, status }: { createdAt: string; status: UiStatus }) {
    const [now, setNow] = useState(Date.now())
    useEffect(() => {
      const t = setInterval(() => setNow(Date.now()), 60 * 1000)
      return () => clearInterval(t)
    }, [])
    const ms = now - new Date(createdAt).getTime()
    const mins = Math.floor(ms / 60000)
    const over = SLA[status] && mins > SLA[status]
    return <span className={over ? 'text-red-600' : 'text-gray-600'}>{mins}m</span>
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>
      <div className="grid grid-cols-4 gap-4">
        {uiCols.map((c) => (
          <div
            key={c}
            className="bg-white border rounded p-2 min-h-[300px]"
            onDragOver={onDragOver}
            onDrop={() => onDrop(c)}
          >
            <div className="font-medium mb-2 flex items-center justify-between">
              <span>{c}</span>
              <span className="text-xs text-gray-500">{grouped[c].length}</span>
            </div>
            <div className="space-y-2">
              {grouped[c].map((o) => (
                <div
                  key={o.id}
                  className="border rounded p-2 bg-gray-50 cursor-move"
                  draggable
                  onDragStart={onDragStart(o.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs">{o.id.slice(0, 8)}</div>
                    <Age createdAt={o.createdAt} status={c} />
                  </div>
                  <div className="text-xs text-gray-600 flex items-center justify-between gap-2">
                    <span>{mapFromServer(o.status)}</span>
                    {assigned[o.id] && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {assigned[o.id]}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <select
                      className="w-full text-xs border rounded px-2 py-1 bg-white"
                      defaultValue=""
                      onChange={async (e) => {
                        const courierId = e.currentTarget.value
                        if (!courierId) return
                        const resp = await fetch(`/api/admin/orders/${o.id}/assign`, {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ courierId }),
                        })
                        if (resp.ok) {
                          const chosen = couriers.find((c) => c.id === courierId)
                          setAssigned((m) => ({ ...m, [o.id]: chosen?.name || 'Assigned' }))
                        }
                      }}
                    >
                      <option value="">Assign courier…</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
