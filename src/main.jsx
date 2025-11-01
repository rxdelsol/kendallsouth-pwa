import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import { initDB } from './store/db'
import { ensurePersistentStorage } from './utils/persist'

async function boot(){
  try{ await initDB() }catch(e){ console.error('DB init failed:', e); alert('Database init failed. Reload.'); }
  const res = await ensurePersistentStorage()
  if(res.supported && !res.persisted){
    setTimeout(()=>alert('Heads-up: Browser did not grant persistent storage. Avoid Incognito and disable "Clear site data on close" for this site.'), 200)
  }
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js') } catch(e){ console.warn('SW failed', e) }
  }
  const root = createRoot(document.getElementById('root'))
  root.render(<App />)
}
boot()
