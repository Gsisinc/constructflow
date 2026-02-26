import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

const root = document.getElementById('root')
try {
  ReactDOM.createRoot(root).render(<App />)
} catch (err) {
  console.error('App failed to mount:', err)
  root.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#102a43;color:#fbbf24;font-family:system-ui,sans-serif;padding:1rem;text-align:center;">
    <h1 style="font-size:1.5rem;margin-bottom:0.5rem;">MYGSIS</h1>
    <p style="color:#94a3b8;margin-bottom:1rem;">Failed to load app. Check the browser console (F12).</p>
    <pre style="background:#1e293b;padding:1rem;border-radius:8px;font-size:0.75rem;overflow:auto;max-width:90%;">${err?.message || String(err)}</pre>
  </div>`
}
