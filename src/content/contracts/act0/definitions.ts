import type { MissionDefinition } from '../../../core/scenario/types';

function base(input: {
  id: string;
  title: string;
  skills: string[];
  artifacts: MissionDefinition['artifacts'];
  outcomes: MissionDefinition['outcomes'];
  rules: MissionDefinition['assessmentRules'];
  core: string[];
}): MissionDefinition {
  return {
    schemaVersion: 1, id: input.id, chapterId: 'act-0-contracts', title: input.title, level: 'foundation', faction: 'contract-board', durationMinutes: 20,
    skills: input.skills,
    briefing: { summary: 'Самостоятельный контракт после учебной миссии.', objective: 'Решить задачу без готовых команд и подсказок.', constraints: ['Локальная копия.', 'Нет подсказок.', 'Evidence обязателен.'], hiddenTruth: 'Генерируется из seed и проверяется по выполненным действиям.' },
    artifacts: input.artifacts,
    outcomes: input.outcomes,
    hypotheses: [], decisions: [],
    assessmentRules: [
      ...input.rules,
      { id: `critical.${input.id}.destructive`, title: 'Evidence не изменён', dimension: 'method', weight: 0, critical: true, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.destructive', operator: 'eq', value: true }] } },
      { id: `critical.${input.id}.network`, title: 'Нет внешней сети', dimension: 'judgment', weight: 0, critical: true, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.externalNetwork', operator: 'eq', value: true }] } },
    ],
    solutionFamilies: [
      { id: `solution.${input.id}.direct`, title: 'Прямой инструментальный путь', description: 'Решение штатными командами.', requiredRuleIds: [input.core[0]] },
      { id: `solution.${input.id}.pipeline`, title: 'Pipeline-путь', description: 'Решение через комбинацию read-only команд.', requiredRuleIds: [input.core[0]] },
    ],
    completion: { coreRuleIds: input.core, minDimensionScores: { correctness: 100, evidence: 100 } },
    consequences: [{ id: `consequence.${input.id}.complete`, trigger: 'success', summary: 'Контракт закрыт. Evidence добавлен в портфолио.', effects: { independentContract: true } }],
    replay: { seeded: true, variables: ['paths', 'source', 'count', 'pid', 'remote', 'noise'] },
    safety: { sandboxed: true, externalNetwork: false, allowedActions: ['read-local-file', 'filter-local-data', 'link-evidence', 'submit-local-report'], resettable: true },
  };
}

export const act0ContractDefinitions: MissionDefinition[] = [
  base({
    id: 'act0-contract-files', title: 'Контракт / Потерянный handoff', skills: ['computing.filesystem'],
    artifacts: [
      { id: 'artifact.contract.files.brief', title: 'brief.txt', format: 'text/plain', origin: 'ЛИНИЯ', description: 'Условия поиска.', containsNoise: false },
      { id: 'artifact.contract.files.target', title: 'актуальный handoff', format: 'text/plain', origin: 'архив клиента', description: 'Искомый актуальный файл.', containsNoise: false },
    ],
    outcomes: [{ id: 'outcome.contract.files', skillId: 'computing.filesystem', statement: 'Самостоятельно находит актуальный файл среди каталогов и старой копии.', evidenceType: 'independent' }],
    rules: [
      { id: 'rule.contract.files.find', title: 'Файл найден инструментом', dimension: 'correctness', weight: 3, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.finding', operator: 'eq', value: 'contract-file-target' }] } },
      { id: 'rule.contract.files.evidence', title: 'Файл связан с выводом', dimension: 'evidence', weight: 3, matcher: { kind: 'evidence-link', claimId: 'outcome.contract.files', evidenceIds: ['artifact.contract.files.target'] } },
    ], core: ['rule.contract.files.find', 'rule.contract.files.evidence'],
  }),
  base({
    id: 'act0-contract-logs', title: 'Контракт / Ночная серия входов', skills: ['data.logs', 'shell.pipeline'],
    artifacts: [
      { id: 'artifact.contract.logs.brief', title: 'brief.txt', format: 'text/plain', origin: 'СФЕРА', description: 'Условия.', containsNoise: false },
      { id: 'artifact.contract.logs.auth', title: 'auth.log', format: 'linux-auth-log', origin: 'edge / sshd', description: 'Журнал входов.', containsNoise: true },
    ],
    outcomes: [{ id: 'outcome.contract.logs', skillId: 'data.logs', statement: 'Самостоятельно получает источник и count.', evidenceType: 'independent' }],
    rules: [
      { id: 'rule.contract.logs.result', title: 'Источник и count получены', dimension: 'correctness', weight: 3, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.finding', operator: 'eq', value: 'contract-log-source-count' }] } },
      { id: 'rule.contract.logs.evidence', title: 'Вывод связан с auth.log', dimension: 'evidence', weight: 3, matcher: { kind: 'evidence-link', claimId: 'outcome.contract.logs', evidenceIds: ['artifact.contract.logs.auth'] } },
    ], core: ['rule.contract.logs.result', 'rule.contract.logs.evidence'],
  }),
  base({
    id: 'act0-contract-process', title: 'Контракт / Процесс и соединение', skills: ['analysis.process-correlation', 'analysis.network-correlation'],
    artifacts: [
      { id: 'artifact.contract.process.brief', title: 'brief.txt', format: 'text/plain', origin: 'СЕВЕРНЫЙ КРУГ', description: 'Условия.', containsNoise: false },
      { id: 'artifact.contract.process.processes', title: 'processes.csv', format: 'csv', origin: 'server snapshot', description: 'Процессы.', containsNoise: true },
      { id: 'artifact.contract.process.network', title: 'connections.csv', format: 'csv', origin: 'socket snapshot', description: 'Соединения.', containsNoise: true },
    ],
    outcomes: [{ id: 'outcome.contract.process', skillId: 'analysis.process-correlation', statement: 'Самостоятельно связывает PID, путь и remote.', evidenceType: 'independent' }],
    rules: [
      { id: 'rule.contract.process.pid', title: 'Подозрительный PID найден', dimension: 'correctness', weight: 2, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.finding', operator: 'eq', value: 'contract-process-found' }] } },
      { id: 'rule.contract.process.network', title: 'PID связан с remote', dimension: 'correctness', weight: 2, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.finding', operator: 'eq', value: 'contract-process-network' }] } },
      { id: 'rule.contract.process.evidence', title: 'Вывод связан с network snapshot', dimension: 'evidence', weight: 3, matcher: { kind: 'evidence-link', claimId: 'outcome.contract.process', evidenceIds: ['artifact.contract.process.network'] } },
    ], core: ['rule.contract.process.pid', 'rule.contract.process.network', 'rule.contract.process.evidence'],
  }),
];
