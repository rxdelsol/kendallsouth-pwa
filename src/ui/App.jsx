import React, { useEffect, useState } from 'react'
import { api, setApiBase, getApiBase, setToken, clearAuth } from '../lib/api'
import './styles.css'

const LOGO = '/icons/logo.png'

function CredsPage({ user }){
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const empty = {provider:'', credential_type:'', issue_date:'', expiry_date:'', notify_email:'', npi:'', notes:''}
  const [form, setForm] = useState(empty)

  async function refresh(){
    try{
      const r = await api.listCreds()
      const f = (filter||'').toLowerCase()
      const items = (r.items||[]).filter(x => !f || [x.provider,x.credential_type,x.notes||''].some(s => (s||'').toLowerCase().includes(f)))
      setRows(items)
    }catch(e){ alert('Load failed: '+e.message) }
  }
  useEffect(()=>{ refresh() }, [filter])

  return (<>
    <header>
      <div className="brand">
        <img src={LOGO} alt="Kendall South Medical Center logo"/>
        <div>
          <h1>Kendall South Medical Center — Provider Credential Tracker</h1>
          <div className="muted" style={{fontSize:12}}>Signed in as {user?.email}</div>
        </div>
      </div>
      <div className="toolbar">
        <input placeholder="API URL (e.g., https://your-server.onrender.com)" defaultValue={getApiBase()} onBlur={e=>{ setApiBase(e.target.value.trim()); }} />
        <button className="secondary" onClick={()=>{ clearAuth(); location.reload() }}>🚪 Logout</button>
      </div>
    </header>

    <div className="container">
      <div className="toolbar" style={{marginBottom:12}}>
        <input placeholder="Filter..." value={filter} onChange={e=>setFilter(e.target.value)} />
        <button onClick={()=>setFilter(filter)}>Apply</button>
        <button className="secondary" onClick={()=>setFilter('')}>Clear</button>
        <button onClick={()=>{ setEdit(null); setForm(empty); setOpen(true) }}>➕ Add</button>
        <button className="secondary" onClick={refresh}>🔄 Reload</button>
      </div>

      <table>
        <thead>
          <tr><th>ID</th><th>Provider</th><th>Type</th><th>Issued</</th><th>Expires</th><th>Notify Email</th><th>NPI</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.provider}</td><td>{r.credential_type}</td>
              <td className="muted">{r.issue_date||''}</td><td>{r.expiry_date||''}</td>
              <td className="muted">{r.notify_email||''}</td>
              <td className="muted">{r.npi||''}</td>
              <td className="row-actions">
                <button onClick={()=>{ setEdit(r); setForm(r); setOpen(true) }}>✏️</button>
                <button onClick={async()=>{ if(confirm('Delete?')){ await api.deleteCred(r.id); await refresh(); }}}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {open && (
      <div className="modal-backdrop" style={{display:'flex'}}>
        <div className="modal">
          <h2>{edit ? 'Edit' : 'Add'} credential</h2>
          <div className="grid">
            <div><label>Provider</label><input value={form.provider} onChange={e=>setForm({...form, provider:e.target.value})}/></div>
            <div><label>Type</label><input value={form.credential_type} onChange={e=>setForm({...form, credential_type:e.target.value})}/></div>
            <div><label>Issued (YYYY-MM-DD)</label><input value={form.issue_date} onChange={e=>setForm({...form, issue_date:e.target.value})}/></div>
            <div><label>Expires (YYYY-MM-DD)</label><input value={form.expiry_date} onChange={e=>setForm({...form, expiry_date:e.target.value})}/></div>
            <div><label>Notify Email (optional)</label><input value={form.notify_email||''} onChange={e=>setForm({...form, notify_email:e.target.value})}/></div>
            <div><label>NPI</label><input value={form.npi||''} onChange={e=>setForm({...form, npi:e.target.value})}/></div>
            <div style={{gridColumn:'1/-1'}}><label>Notes</label><textarea rows={3} value={form.notes||''} onChange={e=>setForm({...form, notes:e.target.value})}/></div>
          </div>
          <footer style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
            <button onClick={async()=>{
              if(!form.provider || !form.credential_type){ alert('Provider and Type are required.'); return; }
              if(edit){ await api.updateCred(form.id, form) } else { await api.addCred(form) }
              setOpen(false); setEdit(null); await refresh()
            }}>Save</button>
            <button className="secondary" onClick={()=>{ setOpen(false); setEdit(null) }}>Cancel</button>
          </footer>
        </div>
      </div>
    )}
  </>)
}

function LoginPage({ onLogin }){
  const [email, setEmail] = useState('manager@floridatrials.org')
  const [password, setPassword] = useState('ChangeThisPassword123!')
  const [apiBase, setBase] = useState(localStorage.getItem('pct_api_base') || 'https://your-server.onrender.com')
  const [loading, setLoading] = useState(false)
  useEffect(()=>{ localStorage.setItem('pct_api_base', apiBase) }, [apiBase])

  async function submit(e){
    e.preventDefault()
    setLoading(true)
    try{
      const r = await api.login(email, password)
      setToken(r.token)
      onLogin(r.user)
    }catch(e){
      alert('Login failed: '+e.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="auth-card">
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
        <img src={LOGO} alt="Kendall South Medical Center logo" style={{height:40}}/>
        <div>
          <h2 style={{margin:0}}>Kendall South — Sign in</h2>
          <div className="muted" style={{fontSize:12}}>Provider Credential Tracker</div>
        </div>
      </div>
      <div style={{display:'grid', gap:10}}>
        <input placeholder="API URL" value={apiBase} onChange={e=>setBase(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} onClick={submit}>{loading?'Loading...':'Sign in'}</button>
        <div className="muted" style={{fontSize:12}}>Default admin is seeded on the server (.env)</div>
      </div>
    </div>
  )
}

export default function App(){
  const [user, setUser] = useState(null)
  useEffect(()=>{
    (async()=>{
      try{
        const r = await api.me()
        setUser(r.user)
      }catch{ /* not logged in */ }
    })()
  },[])

  if(!user) return <LoginPage onLogin={setUser} />
  return <CredsPage user={user} />
}
