import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe process.env polyfill for browser environments
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  // Bridge Vite environment variables to process.env for compatibility with SDK requirements.
  // This maps VITE_KEY or VITE_API_KEY from your .env file to the expected process.env.API_KEY.
  const viteEnv = (import.meta as any).env || {};
  (window as any).process.env.API_KEY = 
    (window as any).process.env.API_KEY || 
    viteEnv.VITE_API_KEY || 
    viteEnv.VITE_KEY;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);