export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3001'

export async function postJSON(path: string, body: any, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(msg || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getJSON(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, { credentials: 'include', ...(init || {}) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
