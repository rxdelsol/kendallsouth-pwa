export function setApiBase(url){ localStorage.setItem('pct_api_base', url) }
export function getApiBase(){ return localStorage.getItem('pct_api_base') || '' }
export function setToken(t){ localStorage.setItem('pct_token', t) }
export function getToken(){ return localStorage.getItem('pct_token') || '' }
export function clearAuth(){ localStorage.removeItem('pct_token') }

async function req(path, options={}){
  const base = getApiBase()
  const token = getToken()
  const headers = Object.assign({'Content-Type':'application/json'}, options.headers||{})
  if(token) headers['Authorization'] = 'Bearer ' + token
  const res = await fetch(base + path, Object.assign({}, options, { headers }))
  if(res.status === 401){ clearAuth(); throw new Error('Unauthorized') }
  if(!res.ok){ const t = await res.text(); throw new Error(t||('HTTP '+res.status)) }
  const ct = res.headers.get('content-type')||''
  return ct.includes('application/json') ? res.json() : res.text()
}

export const api = {
  health: ()=>req('/api/health'),
  login: (email,password)=>req('/auth/login',{method:'POST', body:JSON.stringify({email,password})}),
  me: ()=>req('/auth/me'),
  listCreds: ()=>req('/api/creds'),
  addCred: (body)=>req('/api/creds',{method:'POST', body:JSON.stringify(body)}),
  updateCred: (id,body)=>req('/api/creds/'+id,{method:'PUT', body:JSON.stringify(body)}),
  deleteCred: (id)=>req('/api/creds/'+id,{method:'DELETE'}),
}
