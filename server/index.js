import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const db = new Database('pct_auth.db')

// --- DB schema
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS creds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    issue_date TEXT,
    expiry_date TEXT,
    notify_email TEXT,
    npi TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`)

// --- Seed admin from env if not exists
function seedAdmin(){
  const email = process.env.ADMIN_EMAIL
  const pass = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'
  if (!email || !pass) return
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (!row){
    const hash = bcrypt.hashSync(pass, 10)
    db.prepare('INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)')
      .run(email, name, hash, 'admin')
    console.log('Seeded admin user:', email)
  }
}
seedAdmin()

// --- Helpers
function signToken(user){
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name }
  return jwt.sign(payload, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })
}
function auth(req, res, next){
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if(!token) return res.status(401).json({ok:false, error:'Missing token'})
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.user = decoded
    next()
  }catch(e){
    return res.status(401).json({ok:false, error:'Invalid token'})
  }
}
function requireAdmin(req, res, next){
  if (req.user?.role !== 'admin') return res.status(403).json({ok:false, error:'Admin only'})
  next()
}

// --- Routes
app.get('/api/health', (req,res)=>res.json({ok:true, status:'up'}))

// Auth
app.post('/auth/login', (req,res)=>{
  const { email, password } = req.body || {}
  if(!email || !password) return res.status(400).json({ok:false, error:'Missing email/password'})
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if(!user) return res.status(401).json({ok:false, error:'Invalid credentials'})
  const ok = bcrypt.compareSync(password, user.password_hash)
  if(!ok) return res.status(401).json({ok:false, error:'Invalid credentials'})
  const token = signToken(user)
  res.json({ok:true, token, user:{id:user.id,email:user.email,name:user.name,role:user.role}})
})

app.get('/auth/me', auth, (req,res)=>{
  res.json({ok:true, user:req.user})
})

// Admin create user
app.post('/auth/register', auth, requireAdmin, (req,res)=>{
  const { email, name, password, role } = req.body || {}
  if(!email || !password) return res.status(400).json({ok:false, error:'Missing email/password'})
  try{
    const hash = bcrypt.hashSync(password, 10)
    const info = db.prepare('INSERT INTO users (email,name,password_hash,role) VALUES (?,?,?,?)')
      .run(email, name||'', hash, role||'user')
    res.json({ok:true, id:info.lastInsertRowid})
  }catch(e){
    res.status(400).json({ok:false, error:e.message})
  }
})

// Creds (CRUD) - scoped to user_id
app.get('/api/creds', auth, (req,res)=>{
  const rows = db.prepare('SELECT * FROM creds WHERE user_id = ? ORDER BY id DESC').all(req.user.id)
  res.json({ok:true, items: rows})
})
app.post('/api/creds', auth, (req,res)=>{
  const { provider, credential_type, issue_date, expiry_date, notify_email, npi, notes } = req.body || {}
  if(!provider || !credential_type) return res.status(400).json({ok:false, error:'Missing provider/type'})
  const info = db.prepare(`
    INSERT INTO creds (user_id,provider,credential_type,issue_date,expiry_date,notify_email,npi,notes)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(req.user.id, provider, credential_type, issue_date||'', expiry_date||'', notify_email||'', npi||'', notes||'')
  res.json({ok:true, id:info.lastInsertRowid})
})
app.put('/api/creds/:id', auth, (req,res)=>{
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM creds WHERE id = ? AND user_id = ?').get(id, req.user.id)
  if(!existing) return res.status(404).json({ok:false, error:'Not found'})
  const { provider, credential_type, issue_date, expiry_date, notify_email, npi, notes } = req.body || {}
  db.prepare(`
    UPDATE creds SET provider=?, credential_type=?, issue_date=?, expiry_date=?, notify_email=?, npi=?, notes=?, updated_at=datetime('now')
    WHERE id=? AND user_id=?
  `).run(provider||existing.provider, credential_type||existing.credential_type, issue_date||existing.issue_date, expiry_date||existing.expiry_date, notify_email||existing.notify_email, npi||existing.npi, notes||existing.notes, id, req.user.id)
  res.json({ok:true})
})
app.delete('/api/creds/:id', auth, (req,res)=>{
  const id = Number(req.params.id)
  db.prepare('DELETE FROM creds WHERE id = ? AND user_id = ?').run(id, req.user.id)
  res.json({ok:true})
})

const PORT = process.env.PORT || 8080
app.listen(PORT, ()=>console.log('PCT Auth server listening on', PORT))
