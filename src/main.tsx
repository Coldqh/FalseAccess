import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProgressProvider } from './system/ProgressContext';
import { MissionRuntimeProvider } from './system/MissionRuntimeContext';
import App from './App';
import '@xterm/xterm/css/xterm.css';
import './styles.css';
import { initializeUpdateManager } from './system/updateManager';

initializeUpdateManager();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <MissionRuntimeProvider>
        <App />
      </MissionRuntimeProvider>
    </ProgressProvider>
  </StrictMode>,
);
