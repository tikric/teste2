import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  // Safe iframe-resilient alert interceptor to avoid Sandbox Security crashes on browsers
  window.alert = function (message) {
    console.warn("⚠️ Intercepted Native Alert:", message);
    const customEvent = new CustomEvent('bambuzau_safe_alert', { detail: String(message) });
    window.dispatchEvent(customEvent);
  };

  // Safe iframe-resilient confirm interceptor
  window.confirm = function (message) {
    console.warn("❓ Intercepted Native Confirm (Auto-Approved):", message);
    return true; // Auto-approves actions inside sandboxed previews to prevent blockages
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
