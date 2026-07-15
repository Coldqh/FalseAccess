import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Maximize2, Minus, X } from 'lucide-react';
import type { AppDefinition, WindowState } from '../types';

interface WindowFrameProps {
  app: AppDefinition;
  state: WindowState;
  active: boolean;
  children: ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
}

export function WindowFrame({ app, state, active, children, onFocus, onClose, onMinimize, onToggleMaximize, onMove }: WindowFrameProps) {
  const dragRef = useRef<{ startX: number; startY: number; windowX: number; windowY: number } | null>(null);

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (state.maximized || (event.target as HTMLElement).closest('button')) return;
    onFocus();
    dragRef.current = { startX: event.clientX, startY: event.clientY, windowX: state.x, windowY: state.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const nextX = Math.max(0, dragRef.current.windowX + event.clientX - dragRef.current.startX);
    const nextY = Math.max(34, dragRef.current.windowY + event.clientY - dragRef.current.startY);
    onMove(nextX, nextY);
  };

  const endDrag = () => { dragRef.current = null; };

  if (state.minimized) return null;

  return (
    <section
      className={`window-frame ${active ? 'active' : ''} ${state.maximized ? 'maximized' : ''}`}
      style={state.maximized ? { zIndex: state.z } : { left: state.x, top: state.y, width: state.width, height: state.height, zIndex: state.z }}
      onPointerDown={onFocus}
    >
      <header className="window-titlebar" onDoubleClick={onToggleMaximize} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="window-identity">
          <span className="window-app-mark" style={{ '--app-accent': app.accent } as React.CSSProperties}><app.icon size={15} /></span>
          <strong>{app.title}</strong>
          <span className="window-status">LOCAL</span>
        </div>
        <div className="window-actions">
          <button onClick={onMinimize} aria-label="Свернуть"><Minus size={15} /></button>
          <button onClick={onToggleMaximize} aria-label="Развернуть"><Maximize2 size={13} /></button>
          <button className="close" onClick={onClose} aria-label="Закрыть"><X size={15} /></button>
        </div>
      </header>
      <div className="window-content">{children}</div>
    </section>
  );
}
