import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n';
import { TributeProvider } from './context/TributeContext';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Use placeholder so GoogleOAuthProvider always mounts (avoids hook errors)
// Replace with real client ID via VITE_GOOGLE_CLIENT_ID env var
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'not-configured';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <TributeProvider>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </TributeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
