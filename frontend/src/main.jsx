import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios' // <--- 1. Import Axios
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'

// <--- 2. Add this line. PASTE YOUR RENDER URL INSIDE THE QUOTES --->
axios.defaults.baseURL = 'https://society-app-backend.onrender.com'; 
// (Example: 'https://society-app-backend-a1b2.onrender.com')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
