import './styles/global.css'
import './components/AppLayout.css'
import './components/DropZone.css'
import './components/OptionsPanel.css'
import './components/ImageList.css'
import './components/ProgressBar.css'
import './components/Toolbar.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
