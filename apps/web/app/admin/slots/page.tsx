'use client'
import { useEffect, useMemo, useState } from 'react'

type SlotRow = {
  id: string
  label: string
  capacity: number
  reserved: number
  cutoffAt?: string | null
}

export default function AdminSlots() {
  const [city, setCity] = useState('al-ain')
  const [calendar, setCalendar] = useState<any>({ days: [] as any[] })
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch(`/api/admin/slots/calendar?city=${encodeURIComponent(city)}`)
    if (res.ok) setCalendar(await res.json())
  }
  useEffect(() => {
    load()
  }, [city])

  const rows: SlotRow[] = useMemo(() => {
    const day = calendar.days?.find((d: any) => d.date === date)
    return (day?.slots || []).map((s: any) => ({
      id: s.id,
      label: s.label,
      capacity: s.capacity,
      reserved: s.reserved,
      cutoffAt: s.cutoffAt,
    }))
  }, [calendar, date])

  async function saveInline(row: SlotRow) {
    const payload = {
      date,
      city,
      window: row.label,
      capacity: row.capacity,
      cutoffAt: row.cutoffAt || null,
    }
    const res = await fetch('/api/admin/slots', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const j = await res.json()
    setMsg(j?.ok ? 'Saved' : 'Failed')
    await load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Slots</h1>
      <div className="flex gap-3 mb-4 items-end">
        <div>
          <label className="block text-sm text-gray-600 mb-1">City</label>
          <input
            className="border rounded px-3 py-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="p-2 border-b">Window</th>
              <th className="p-2 border-b">Capacity</th>
              <th className="p-2 border-b">Reserved</th>
              <th className="p-2 border-b">Left</th>
              <th className="p-2 border-b">Cutoff</th>
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const left = Math.max((r.capacity || 0) - (r.reserved || 0), 0)
              return (
                <tr key={r.id} className="text-sm">
                  <td className="p-2 border-b font-mono">{r.label}</td>
                  <td className="p-2 border-b">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1"
                      defaultValue={r.capacity}
                      onBlur={(e) => {
                        r.capacity = parseInt(e.currentTarget.value, 10) || 0
                        saveInline(r)
                      }}
                    />
                  </td>
                  <td className="p-2 border-b">{r.reserved}</td>
                  <td className="p-2 border-b">{left}</td>
                  <td className="p-2 border-b">
                    <input
                      className="w-48 border rounded px-2 py-1"
                      placeholder="YYYY-MM-DDTHH:MM:SSZ"
                      defaultValue={r.cutoffAt || ''}
                      onBlur={(e) => {
                        r.cutoffAt = e.currentTarget.value || null
                        saveInline(r)
                      }}
                    />
                  </td>
                  <td className="p-2 border-b">
                    <button className="px-3 py-1 rounded bg-gray-100" onClick={() => saveInline(r)}>
                      Save
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
