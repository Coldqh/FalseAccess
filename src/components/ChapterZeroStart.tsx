import { ArrowRight, FileArchive, HardDrive, ShieldCheck } from 'lucide-react';
import { getMissionDefinition } from '../content/missions/registry';
import { useMissionRuntime } from '../system/MissionRuntimeContext';

export function ChapterZeroStart() {
  const { activeMission, markArtifactOpened } = useMissionRuntime();
  const definition = activeMission ? getMissionDefinition(activeMission.missionId) : null;

  if (!activeMission || activeMission.missionId !== 'workspace-01' || !definition) {
    return <main className="chapter-zero-loading">Подготовка локальной копии…</main>;
  }

  const accept = () => markArtifactOpened('artifact.workspace.intake', 'chapter-zero-start');

  return (
    <main className="chapter-zero-start">
      <div className="chapter-zero-grid" />
      <section className="chapter-zero-start-card">
        <header>
          <div className="chapter-zero-mark"><ShieldCheck size={27} /></div>
          <div>
            <p className="eyebrow">ГЛАВА 0.1 / ЛОКАЛЬНАЯ КОПИЯ</p>
            <h1>Рабочее место</h1>
          </div>
          <span>NO NETWORK</span>
        </header>

        <div className="chapter-zero-message">
          <div className="chapter-zero-avatar">МБ</div>
          <div>
            <strong>Максим Белов</strong>
            <p>Я передал очищенную копию материалов клиники. Здесь ничего не нужно ломать. Сначала научись находить файлы и понимать, где именно ты работаешь.</p>
          </div>
        </div>

        <div className="chapter-zero-package">
          <FileArchive size={25} />
          <div>
            <strong>workspace-clinic-01.local</strong>
            <span>Файловая система · read-only · фиксированный seed</span>
          </div>
          <HardDrive size={20} />
        </div>

        <section className="chapter-zero-briefing">
          <div>
            <span>ЗАДАЧА</span>
            <p>{definition.briefing.objective}</p>
          </div>
          <div>
            <span>ОГРАНИЧЕНИЯ</span>
            <ul>{definition.briefing.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>
          </div>
        </section>

        <button className="primary-action chapter-zero-start-action" onClick={accept}>
          Открыть рабочую копию <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
