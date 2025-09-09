export function getAttemptKey() {
  if (typeof window === 'undefined') return ''
  const k = localStorage.getItem('checkout_attempt')
  if (k) return k
  const v = crypto.randomUUID()
  localStorage.setItem('checkout_attempt', v)
  return v
}
