import { Check, CornerDownLeft } from 'lucide-react';

interface Props {
  speaker?: string;
  title: string;
  text: string;
  detail?: string;
  code?: string;
  insertLabel?: string;
  onInsert?: () => void;
  onCheck?: () => void;
  checkReady?: boolean;
}

export function MissionGuideStrip({ speaker = 'МБ', title, text, detail, code, insertLabel = 'Вставить', onInsert, onCheck, checkReady }: Props) {
  return (
    <section className="mission-guide-strip">
      <div className="mission-guide-speaker">{speaker}</div>
      <div className="mission-guide-copy">
        <strong>{title}</strong>
        <p>{text}</p>
        {detail && <small>{detail}</small>}
      </div>
      {code && <code>{code}</code>}
      <div className="mission-guide-actions">
        {onInsert && <button onClick={onInsert}>{insertLabel}<CornerDownLeft size={14} /></button>}
        {onCheck && <button className={checkReady ? 'ready' : ''} onClick={onCheck}><Check size={14} />Проверить готово</button>}
      </div>
    </section>
  );
}
