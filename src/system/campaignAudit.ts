import type { ProgressState } from '../types';
import { foundationModules } from '../data/foundationPractice';
import { curriculumModules, curriculumSources } from '../data/curriculum';
import { academyLessons } from '../data/academy';
import { learningPrinciples, learningReferences } from '../data/learningStandards';
import { APP_VERSION } from './updateManager';

export interface CampaignAuditCheck { id: string; title: string; detail: string; status: 'pass' | 'warn'; }

export function campaignAuditChecks(progress: ProgressState): CampaignAuditCheck[] {
  const duplicateAcademyIds = academyLessons.length !== new Set(academyLessons.map((item) => item.id)).size;
  const duplicateCurriculumIds = curriculumModules.length !== new Set(curriculumModules.map((item) => item.id)).size;
  const foundationDone = progress.foundationModulesComplete.length;
  const modulesHaveRubrics = foundationModules.every((module) => module.finalRubric.minWords > 0 && module.finalRubric.requiredGroups.length >= 4);
  const modulesHaveBoundaries = foundationModules.every((module) => module.sourceIds.length >= 2 && module.evidence.length >= 3 && module.limitations.length >= 3);
  const commandsAreStructured = foundationModules.every((module) => module.tasks.every((task) => task.allowedStarts.length > 0 && task.commandPatterns.length > 0));
  const noFoundationProduction = foundationModules.every((module) => Object.values(module.skillFloors).every((track) => !track || track.production === undefined));
  const sourceVersionsExplicit = curriculumSources.every((source) => source.version.length > 3 && source.assessment.length > 10);
  const referencesAligned = learningReferences.length >= 8 && learningPrinciples.length >= 6;
  const temporaryStateValid = !progress.windowsCaseComplete || progress.windowsCaseStage >= 7;

  return [
    { id: 'version', title: 'Версия runtime', detail: `Учебная перестройка работает поверх runtime ${APP_VERSION}.`, status: APP_VERSION === '1.1.0' ? 'pass' : 'warn' },
    { id: 'foundation-data', title: 'Этапы 0–3 описаны данными', detail: `Найдено ${foundationModules.length}/4 foundation-модулей.`, status: foundationModules.length === 4 ? 'pass' : 'warn' },
    { id: 'rubrics', title: 'Открытые ответы имеют рубрики', detail: modulesHaveRubrics ? 'Каждый этап проверяет несколько независимых элементов и минимальную содержательность.' : 'Часть этапов всё ещё принимает ответ по одному слову.', status: modulesHaveRubrics ? 'pass' : 'warn' },
    { id: 'boundaries', title: 'Указаны evidence и ограничения', detail: modulesHaveBoundaries ? 'Каждый этап показывает, что он подтверждает и чего не подтверждает.' : 'Не у всех этапов описаны границы.', status: modulesHaveBoundaries ? 'pass' : 'warn' },
    { id: 'commands', title: 'Команды проверяются структурно', detail: commandsAreStructured ? 'Проверяется разрешённый инструмент и полная форма команды; набора ключевых слов недостаточно.' : 'Остались задачи со старой token-only проверкой.', status: commandsAreStructured ? 'pass' : 'warn' },
    { id: 'production', title: 'Foundation не выдаёт рабочий опыт', detail: noFoundationProduction ? 'Этапы 0–3 не начисляют production за учебный снимок.' : 'Foundation всё ещё повышает production.', status: noFoundationProduction ? 'pass' : 'warn' },
    { id: 'sources', title: 'Источники и методы оценки зафиксированы', detail: sourceVersionsExplicit && referencesAligned ? `${learningReferences.length} внешних программ и стандартов связаны с assessment model.` : 'Источник или метод оценки описан неполно.', status: sourceVersionsExplicit && referencesAligned ? 'pass' : 'warn' },
    { id: 'academy-ids', title: 'Уникальные Academy ID', detail: duplicateAcademyIds ? 'Найдены повторяющиеся ID.' : 'Повторяющихся ID нет.', status: duplicateAcademyIds ? 'warn' : 'pass' },
    { id: 'curriculum-ids', title: 'Уникальные Curriculum ID', detail: duplicateCurriculumIds ? 'Найдены повторяющиеся ID.' : 'Повторяющихся ID нет.', status: duplicateCurriculumIds ? 'warn' : 'pass' },
    { id: 'temporary-apps', title: 'Сюжетные приложения закрываются', detail: temporaryStateValid ? 'Завершённый Windows case не остаётся на промежуточном stage.' : 'Найден старый незавершённый stage.', status: temporaryStateValid ? 'pass' : 'warn' },
    { id: 'foundation-progress', title: 'Игровой прогресс назван честно', detail: `Освоено ${foundationDone}/4 этапов. Это внутриигровое evidence, а не внешний сертификат.`, status: foundationDone === 4 ? 'pass' : 'warn' },
  ];
}
