import { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';
import {
  APP_VERSION, checkForUpdates, forceRefreshToLatest, getUpdateState, subscribeUpdateState,
  type AppUpdateState,
} from '../system/updateManager';

function useAppUpdateState() {
  const [state, setState] = useState<AppUpdateState>(getUpdateState());
  useEffect(() => subscribeUpdateState(setState), []);
  return state;
}

export function UpdateButton({ mode = 'check', compact = false }: { mode?: 'check' | 'force'; compact?: boolean }) {
  const state = useAppUpdateState();
  const busy = state.phase === 'checking' || state.phase === 'updating';
  const run = () => mode === 'force' ? forceRefreshToLatest() : checkForUpdates(true);
  const label = state.phase === 'checking'
    ? 'Проверка...'
    : state.phase === 'updating'
      ? 'Обновление...'
      : mode === 'force'
        ? 'Принудительно обновить'
        : 'Проверить обновление';

  return (
    <button
      type="button"
      className={`fa-update-button ${compact ? 'compact' : ''} ${state.phase}`}
      disabled={busy}
      onClick={run}
      title={`${label} · ${APP_VERSION}`}
    >
      {state.phase === 'offline' ? <WifiOff size={compact ? 14 : 16} /> : state.phase === 'latest' ? <CheckCircle2 size={compact ? 14 : 16} /> : <RefreshCw size={compact ? 14 : 16} className={busy ? 'spin' : ''} />}
      {!compact && <span>{label}</span>}
      {!compact && <small>{APP_VERSION}</small>}
    </button>
  );
}

export function UpdateBanner() {
  const state = useAppUpdateState();
  if (!['available', 'updating', 'error'].includes(state.phase)) return null;
  return (
    <div className={`fa-update-banner ${state.phase}`} role="status">
      <RefreshCw size={15} className={state.phase === 'checking' || state.phase === 'updating' ? 'spin' : ''} />
      <span>{state.message}</span>
      {state.phase === 'available' && <button onClick={() => forceRefreshToLatest(state.latestVersion)}>Обновить</button>}
    </div>
  );
}
