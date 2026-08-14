// Temporary diagnostic endpoint to probe the backend from the Next.js server
// GET /api/_proxy-health
export async function GET() {
  const configured = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
  const candidates = []

  if (configured) candidates.push(String(configured).replace(/\/$/, ''))

  // Common fallback ports used in discussions: 5001 (Kestrel HTTPS dev), 7147 (Kestrel HTTPS), 5000 (HTTP)
  ['https://localhost:5001', 'https://localhost:7147', 'http://localhost:5279'].forEach(base =>
    candidates.push(`${base}/api`)
  )

  // Deduplicate candidates while preserving order
  const seen = new Set()
  const unique = candidates.filter(c => (seen.has(c) ? false : seen.add(c)))

  const timeoutMs = 3000

  const results = []

  for (const base of unique) {
    const target = `${base.replace(/\/$/, '')}/health`
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(target, { method: 'GET', signal: controller.signal })
      clearTimeout(id)
      let body
      try { body = await res.json() } catch (_) { try { body = await res.text() } catch { body = null } }
      results.push({ backendUrl: base, ok: res.ok, status: res.status, body })
      // If reachable and OK (200-299), stop probing further
      if (res.ok) break
    } catch (err) {
      clearTimeout(id)
      results.push({ backendUrl: base, ok: false, error: err?.message || String(err) })
    }
  }

  const anyOk = results.find(r => r.ok)
  const status = anyOk ? 200 : 502

  const payload = { checked: unique, results }
  if (process.env.NODE_ENV === 'development') payload.env = { BACKEND_API_URL: process.env.BACKEND_API_URL || null }

  return new Response(JSON.stringify(payload, null, 2), { status, headers: { 'Content-Type': 'application/json' } })
}
