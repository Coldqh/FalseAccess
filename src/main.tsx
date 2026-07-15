import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProgressProvider } from './system/ProgressContext';
import App from './App';
import '@xterm/xterm/css/xterm.css';
import './styles.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
