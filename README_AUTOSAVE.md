# Provider Credential Tracker — Static PWA (Autosave Enabled)
- IndexedDB storage with **persistent storage** request
- Backup/Restore (JSON)
- NPI lookup with CORS fallback
- Installable PWA with Kendall South logo

## Run (dev)
```bash
npm install
npm run dev
```

## Deploy (static hosting)
- Vercel / Netlify / GitHub Pages
- Build: `npm run build` → publish `dist/`

## Persistence tips
- Avoid Incognito/InPrivate (clears data on close)
- In Chrome/Edge → Settings → Privacy & security → Cookies & site data → **disable "Clear cookies and site data when you close all windows"** for this site
- Install the PWA (⋯ → Install) for best persistence
