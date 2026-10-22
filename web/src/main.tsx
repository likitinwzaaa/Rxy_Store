import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { isBrowser } from './lib/nui'
import { lockdown } from './lib/csp'

import './styles/fonts.css'
import './styles/base.css'
import './styles/ui.css'
import './styles/home.css'
import './styles/modal.css'
import './styles/cart.css'
import './styles/payment.css'
import './styles/history.css'
import './styles/inbox.css'
import './styles/admin.css'

if (isBrowser) {
  document.body.classList.add('browser')
} else {
  lockdown()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
