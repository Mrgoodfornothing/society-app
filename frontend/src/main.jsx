import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- 1. Import this
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'

 //axios.defaults.baseURL = '...'; 
 axios.defaults.baseURL = window.location.hostname === "localhost" 
  ? "http://localhost:5001" 
  : "https://society-app-backend.onrender.com"; // <--- Update this after deployment

// <--- 2. Paste your NEW Client ID here --->
const GOOGLE_CLIENT_ID = "317231645347-fshpbpuilu0qlp5vnv05ab59q3f9nk5t.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> {/* <--- 3. Wrap everything here */}
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)