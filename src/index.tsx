import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  });
}

const root = document.getElementById('root')!
createRoot(root).render(<App />)
