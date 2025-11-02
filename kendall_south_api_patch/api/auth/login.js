// /api/auth/login.js
import { getUserByEmail } from '../_db.js'
import { signToken, comparePassword } from '../_auth.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return res.status(204).end()
    }

    if (req.method === 'GET') {
      return res.status(405).json({ ok: false, error: 'Use POST /api/auth/login' })
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}') } catch { body = {} }
    }

    const { email, password } = body || {}
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Missing email/password' })
    }

    const user = await getUserByEmail(email)
    if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const ok = await comparePassword(password, user.password_hash)
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' })

    const token = signToken(user)
    return res.json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
