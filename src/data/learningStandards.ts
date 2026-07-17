export type LearningEvidenceLevel = 'orientation' | 'guided-practice' | 'independent-practice' | 'validated-performance';

export interface LearningReference {
  id: string;
  authority: string;
  title: string;
  version: string;
  contribution: string;
  assessmentModel: string;
}

export const learningReferences: LearningReference[] = [
  {
    id: 'cs50-cyber',
    authority: 'Harvard / CS50',
    title: "CS50's Introduction to Cybersecurity",
    version: 'OpenCourseWare 2026',
    contribution: 'Риски, компромиссы, защита аккаунтов, данных, систем, ПО и приватности.',
    assessmentModel: 'Материал закрепляется заданиями и итоговым проектом, а не одним тестом на узнавание.',
  },
  {
    id: 'stanford-cs155',
    authority: 'Stanford',
    title: 'CS155 Computer and Network Security',
    version: 'Spring 2026',
    contribution: 'Системная, web- и сетевая безопасность, криптография, supply chain и разбор реальных отказов защиты.',
    assessmentModel: 'Проекты требуют писать и проверять код, понимать атаку и строить защиту.',
  },
  {
    id: 'berkeley-cs161',
    authority: 'UC Berkeley',
    title: 'CS161 Computer Security',
    version: 'Spring 2026',
    contribution: 'Security principles, memory safety, web, crypto, сети и проектная работа в изолированных средах.',
    assessmentModel: 'Домашние работы, три проекта, checkpoints и hidden tests.',
  },
  {
    id: 'portswigger',
    authority: 'PortSwigger',
    title: 'Web Security Academy',
    version: 'Living curriculum · 2026',
    contribution: 'Практические классы web-уязвимостей, безопасные лаборатории и самостоятельный recon.',
    assessmentModel: 'Исполняемые labs и mystery labs, где тип проблемы заранее не сообщается.',
  },
  {
    id: 'nice',
    authority: 'NIST NICE',
    title: 'NICE Workforce Framework Components',
    version: '2.2.0 · 2026',
    contribution: 'Связь задач, знаний и наблюдаемых навыков без подмены профессии игровым уровнем.',
    assessmentModel: 'Навык подтверждается выполнением задачи и наблюдаемым действием.',
  },
  {
    id: 'nist-ir',
    authority: 'NIST',
    title: 'Incident Response Recommendations',
    version: 'SP 800-61 Rev. 3 · 2025',
    contribution: 'Подготовка, обнаружение, response, recovery и связь IR с управлением риском.',
    assessmentModel: 'Решения оцениваются по evidence, scope, влиянию на бизнес и восстановлению.',
  },
  {
    id: 'owasp',
    authority: 'OWASP',
    title: 'WSTG / API Security / MASVS',
    version: 'Current projects · 2026',
    contribution: 'Web, API, mobile, authorization, input validation и безопасное хранение.',
    assessmentModel: 'Проверка конкретного объекта, trust boundary и server-side controls.',
  },
  {
    id: 'sc200',
    authority: 'Microsoft Learn',
    title: 'SC-200 Security Operations Analyst',
    version: 'Skills measured · 16 Apr 2026',
    contribution: 'SOC operations, triage, incident response, hunting, KQL и detection engineering.',
    assessmentModel: 'Ролевые задачи в SIEM/XDR, расследование, hunting и operational response.',
  },
] as const;

export const learningEvidenceLabels: Record<LearningEvidenceLevel, string> = {
  orientation: 'Знакомство',
  'guided-practice': 'Практика с опорой',
  'independent-practice': 'Самостоятельная практика',
  'validated-performance': 'Проверенное выполнение',
};

export const learningPrinciples = [
  'Игровой прогресс не называется профессиональной сертификацией.',
  'Тема считается знакомой после теории, но навык — только после наблюдаемого действия.',
  'Самостоятельная часть использует новый набор данных, а не повторяет учебный пример.',
  'Команда должна быть структурно корректной; наличие ключевых слов недостаточно.',
  'Отчёт разделяет подтверждённые факты, гипотезы, ограничения и следующие проверки.',
  'Ошибочный containment имеет последствия и не маскируется правильной финальной кнопкой.',
  'Покрытие темы не означает полного владения направлением.',
] as const;

export function getLearningReference(id: string) {
  return learningReferences.find((reference) => reference.id === id);
}
