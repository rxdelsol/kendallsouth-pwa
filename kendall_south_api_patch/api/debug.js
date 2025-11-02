// /api/debug.js
export default async function handler(req, res) {
  const body = typeof req.body === 'string' ? req.body : (req.body ? JSON.stringify(req.body) : null)
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    ok: true,
    method: req.method,
    url: req.url,
    contentType: req.headers['content-type'] || null,
    hasAuth: Boolean(req.headers['authorization']),
    rawBody: body
  })
}
