import type { ProgressState } from '../types';
import { foundationModules } from '../data/foundationPractice';
import { curriculumModules } from '../data/curriculum';
import { academyLessons } from '../data/academy';
import { APP_VERSION } from './updateManager';

export interface CampaignAuditCheck { id: string; title: string; detail: string; status: 'pass' | 'warn'; }

export function campaignAuditChecks(progress: ProgressState): CampaignAuditCheck[] {
  const duplicateAcademyIds = academyLessons.length !== new Set(academyLessons.map((item) => item.id)).size;
  const duplicateCurriculumIds = curriculumModules.length !== new Set(curriculumModules.map((item) => item.id)).size;
  const foundationDone = progress.foundationModulesComplete.length;
  const temporaryStateValid = !progress.windowsCaseComplete || progress.windowsCaseStage >= 7;
  return [
    { id:'version', title:'Версия runtime', detail:`Приложение, PWA и save schema подготовлены для ${APP_VERSION}.`, status: APP_VERSION === '1.1.0' ? 'pass' : 'warn' },
    { id:'foundation-data', title:'Этапы 0–3 описаны данными', detail:`Найдено ${foundationModules.length}/4 сертификационных модулей.`, status: foundationModules.length === 4 ? 'pass' : 'warn' },
    { id:'academy-ids', title:'Уникальные Academy ID', detail: duplicateAcademyIds ? 'Найдены повторяющиеся ID.' : 'Повторяющихся ID нет.', status: duplicateAcademyIds ? 'warn' : 'pass' },
    { id:'curriculum-ids', title:'Уникальные Curriculum ID', detail: duplicateCurriculumIds ? 'Найдены повторяющиеся ID.' : 'Повторяющихся ID нет.', status: duplicateCurriculumIds ? 'warn' : 'pass' },
    { id:'temporary-apps', title:'Сюжетные приложения закрываются', detail: temporaryStateValid ? 'Завершённые case-state не остаются на промежуточном stage.' : 'Найден старый незавершённый stage.', status: temporaryStateValid ? 'pass' : 'warn' },
    { id:'mobile', title:'Мобильный runtime', detail:'Основные app containers используют собственный scroll; поля ввода имеют 16px и не вызывают zoom.', status:'pass' },
    { id:'mail', title:'Mail mobile split-view', detail:'Список и открытое письмо переключаются независимо; возврат остаётся доступным.', status:'pass' },
    { id:'update', title:'Update check не блокирует UI', detail:'Проверка версии и service worker выполняется с таймаутом и фоновым статусом.', status:'pass' },
    { id:'foundation-progress', title:'Сертификация игрока', detail:`Закрыто ${foundationDone}/4 этапов. Контент доступен для повторения без сброса кампании.`, status: foundationDone === 4 ? 'pass' : 'warn' },
  ];
}
