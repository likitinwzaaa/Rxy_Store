import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { isBrowser } from './lib/nui'
import './index.css'

if (isBrowser) document.body.classList.add('browser')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
