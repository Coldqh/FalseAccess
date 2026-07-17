import type { MissionDefinition } from '../../../core/scenario/types';

function contractDefinition(input: {
  id: string;
  title: string;
  skill: string;
  artifacts: MissionDefinition['artifacts'];
  outcomeId: string;
  outcomeStatement: string;
  finding: string;
  evidenceId: string;
}): MissionDefinition {
  const resultRule = `rule.${input.id}.result`;
  const evidenceRule = `rule.${input.id}.evidence`;
  return {
    schemaVersion: 1,
    id: input.id,
    chapterId: 'act-1-contracts',
    title: input.title,
    level: 'junior',
    faction: 'sfera',
    durationMinutes: 25,
    skills: [input.skill, 'communication.handoff'],
    briefing: {
      summary: 'Самостоятельный контракт после учебной SOC-миссии.',
      objective: 'Получить проверяемый вывод без наставника, готовой команды и раскрытого ответа.',
      constraints: ['Локальная копия telemetry.', 'Подсказки отключены.', 'Нельзя изменять исходники.', 'Evidence link обязателен.'],
      hiddenTruth: 'Данные и шум определяются seed. Валидатор проверяет выполненный результат, а не введённую строку.',
    },
    artifacts: input.artifacts,
    outcomes: [{ id: input.outcomeId, skillId: input.skill, statement: input.outcomeStatement, evidenceType: 'independent' }],
    hypotheses: [],
    decisions: [],
    assessmentRules: [
      { id: resultRule, title: 'Технический результат получен', dimension: 'correctness', weight: 4, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.finding', operator: 'eq', value: input.finding }] } },
      { id: evidenceRule, title: 'Результат связан с источником', dimension: 'evidence', weight: 4, matcher: { kind: 'evidence-link', claimId: input.outcomeId, evidenceIds: [input.evidenceId] } },
      { id: `critical.${input.id}.destructive`, title: 'Evidence не изменён', dimension: 'method', weight: 0, critical: true, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.destructive', operator: 'eq', value: true }] } },
      { id: `critical.${input.id}.network`, title: 'Нет внешней сети', dimension: 'judgment', weight: 0, critical: true, matcher: { kind: 'event', eventType: 'command.executed', where: [{ path: 'payload.externalNetwork', operator: 'eq', value: true }] } },
    ],
    solutionFamilies: [
      { id: `solution.${input.id}.direct`, title: 'Прямой read-only анализ', description: 'Один или несколько прямых запросов к источнику.', requiredRuleIds: [resultRule] },
      { id: `solution.${input.id}.pipeline`, title: 'Pipeline-анализ', description: 'Фильтрация и агрегация через несколько инструментов.', requiredRuleIds: [resultRule] },
    ],
    completion: { coreRuleIds: [resultRule, evidenceRule], minDimensionScores: { correctness: 100, evidence: 100 } },
    consequences: [{ id: `consequence.${input.id}.complete`, trigger: 'success', summary: 'Контракт закрыт, независимое evidence сохранено.', effects: { independentContract: true, sferaTrust: 1 } }],
    replay: { seeded: true, variables: ['host', 'user', 'domain', 'pid', 'count', 'noise', 'event-order'] },
    safety: { sandboxed: true, externalNetwork: false, allowedActions: ['read-local-artifact', 'filter-local-telemetry', 'link-evidence'], resettable: true },
  };
}

export const act1ContractDefinitions: MissionDefinition[] = [
  contractDefinition({
    id: 'act1-contract-mail',
    title: 'Контракт / Письмо поставщику',
    skill: 'soc.mail-triage',
    artifacts: [
      { id: 'artifact.act1.mail.brief', title: 'brief.txt', format: 'text/plain', origin: 'СФЕРА / Service Desk', description: 'Условия контракта.', containsNoise: false },
      { id: 'artifact.act1.mail.eml', title: 'invoice_change.eml', format: 'message/rfc822', origin: 'Mail Gateway', description: 'Сырое письмо с доменной аутентификацией.', containsNoise: true },
      { id: 'artifact.act1.mail.recipients', title: 'recipients.csv', format: 'csv', origin: 'Mail Trace', description: 'Получатели и результаты доставки.', containsNoise: true },
    ],
    outcomeId: 'outcome.act1.mail',
    outcomeStatement: 'Самостоятельно определяет подозрительный домен и подтверждённый масштаб доставки.',
    finding: 'act1-mail-domain-scope',
    evidenceId: 'artifact.act1.mail.eml',
  }),
  contractDefinition({
    id: 'act1-contract-endpoint',
    title: 'Контракт / Необычная process chain',
    skill: 'endpoint.process-chain',
    artifacts: [
      { id: 'artifact.act1.endpoint.brief', title: 'brief.txt', format: 'text/plain', origin: 'СФЕРА / Endpoint Queue', description: 'Условия контракта.', containsNoise: false },
      { id: 'artifact.act1.endpoint.processes', title: 'processes.csv', format: 'csv/process-tree', origin: 'EDR Snapshot', description: 'Процессы нескольких хостов.', containsNoise: true },
      { id: 'artifact.act1.endpoint.network', title: 'connections.csv', format: 'csv/socket-snapshot', origin: 'EDR Network', description: 'Соединения по PID.', containsNoise: true },
    ],
    outcomeId: 'outcome.act1.endpoint',
    outcomeStatement: 'Самостоятельно связывает parent, child, PID, хост и remote.',
    finding: 'act1-endpoint-chain-remote',
    evidenceId: 'artifact.act1.endpoint.processes',
  }),
  contractDefinition({
    id: 'act1-contract-dns',
    title: 'Контракт / DNS-ритм филиала',
    skill: 'network.dns-analysis',
    artifacts: [
      { id: 'artifact.act1.dns.brief', title: 'brief.txt', format: 'text/plain', origin: 'СФЕРА / Network Queue', description: 'Условия контракта.', containsNoise: false },
      { id: 'artifact.act1.dns.log', title: 'dns.log', format: 'dns-telemetry', origin: 'Resolver', description: 'Запросы филиала.', containsNoise: true },
      { id: 'artifact.act1.dns.assets', title: 'assets.csv', format: 'csv/asset-inventory', origin: 'CMDB', description: 'Соответствие IP и узлов.', containsNoise: false },
    ],
    outcomeId: 'outcome.act1.dns',
    outcomeStatement: 'Самостоятельно находит хост, домен и воспроизводимый count периодических запросов.',
    finding: 'act1-dns-host-domain-count',
    evidenceId: 'artifact.act1.dns.log',
  }),
];
