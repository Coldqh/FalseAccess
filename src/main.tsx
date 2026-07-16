import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProgressProvider } from './system/ProgressContext';
import App from './App';
import '@xterm/xterm/css/xterm.css';
import './styles.css';
import { initializeUpdateManager } from './system/updateManager';

initializeUpdateManager();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
