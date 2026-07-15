import type { ContractDifficulty, ContractSkill, GeneratedContract, ProgressState } from '../types';

export const factions = [
  {
    id: 'line',
    name: 'ЛИНИЯ',
    type: 'Техническая биржа',
    description: 'Анонимные заказы от малого бизнеса и частных администраторов. Платят мало, но не требуют знакомств.',
  },
  {
    id: 'north',
    name: 'СЕВЕРНЫЙ КРУГ',
    type: 'Городская группировка',
    description: 'Держат рынки, склады и серые кассы. Им нужны работающие сервисы и люди, которые не задают лишних вопросов.',
  },
  {
    id: 'sfera',
    name: 'СФЕРА',
    type: 'Региональный интегратор',
    description: 'Официальные клиенты, жёсткие отчёты и следы каждого действия. Ошибки запоминают.',
  },
] as const;

function mulberry32(seed: number) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

function ip(random: () => number) {
  return `${pick(random, [37, 45, 62, 77, 91, 103, 185, 194])}.${Math.floor(random() * 220) + 10}.${Math.floor(random() * 240) + 2}.${Math.floor(random() * 240) + 2}`;
}

function localIp(random: () => number) {
  return `10.${Math.floor(random() * 40) + 10}.${Math.floor(random() * 20) + 1}.${Math.floor(random() * 220) + 10}`;
}

function difficultyFor(skill: ContractSkill, index: number): ContractDifficulty {
  if (skill === 'linux' && index === 0) return 'STARTER';
  if (index % 5 === 0) return 'HARD';
  return 'STANDARD';
}

function payFor(difficulty: ContractDifficulty, random: () => number) {
  const base = difficulty === 'STARTER' ? 900 : difficulty === 'STANDARD' ? 1800 : 3200;
  return Math.round((base + random() * base * .45) / 100) * 100;
}

function authContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const source = ip(random);
  const target = pick(random, ['warehouse-gw', 'cashbox-02', 'office-vpn', 'dispatch-01']);
  const users = ['admin', 'root', 'operator', 'backup'];
  const failures = Math.floor(random() * 5) + 5;
  const lines: string[] = [];
  lines.push(`Apr 09 01:42:11 ${target} sshd[901]: Accepted publickey for backup from 10.18.1.4 port 51222 ssh2`);
  for (let i = 0; i < failures; i += 1) {
    const user = users[i % users.length];
    lines.push(`Apr 09 01:4${3 + Math.floor(i / 3)}:${String(10 + i * 3).padStart(2, '0')} ${target} sshd[${1120 + i}]: Failed password for ${user} from ${source} port ${43000 + i * 17} ssh2`);
  }
  lines.push(`Apr 09 02:03:19 ${target} sshd[1299]: Accepted password for operator from 10.18.1.23 port 53012 ssh2`);
  const difficulty = difficultyFor('linux', index);
  return {
    id: `auth-${seed}`,
    seed,
    type: 'AUTH_LOG',
    title: 'Ночная серия входов',
    client: pick(random, ['склад автозапчастей', 'служба доставки', 'серый обменный пункт', 'районная типография']),
    factionId: pick(random, ['line', 'north']),
    factionName: '',
    skill: 'linux',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `На узле ${target} ночью сработало предупреждение SSH. Определи, что видно в журнале, не называя попытки успешным взломом без доказательств.`,
    constraint: 'Сервис нельзя отключать. Работай только с копией журнала.',
    files: [
      { name: 'brief.txt', content: `HOST=${target}\nTASK=Проверить auth.log и дать точный вывод` },
      { name: 'auth.log', content: lines.join('\n') },
    ],
    questions: [
      { id: 'source', label: 'Внешний источник', placeholder: 'IP-адрес', answers: [source] },
      { id: 'count', label: 'Неудачные попытки', placeholder: 'Число', answers: [String(failures)] },
      { id: 'verdict', label: 'Подтверждён успешный внешний вход?', placeholder: 'да / нет', answers: ['нет', 'no'] },
    ],
    hint: `grep "Failed password" auth.log — отфильтрует нужные строки. grep -c посчитает их.`,
  };
}

function dnsContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const host = localIp(random);
  const normalHosts = [localIp(random), localIp(random)];
  const domain = pick(random, ['sync-cache-storage.test', 'cdn-status-node.test', 'telemetry-update.test', 'img-control-panel.test']);
  const repeats = Math.floor(random() * 4) + 5;
  const lines = [
    `09:11:02 ${normalHosts[0]} A intranet.local NOERROR`,
    `09:11:08 ${normalHosts[1]} A api.maps.local NOERROR`,
  ];
  for (let i = 0; i < repeats; i += 1) {
    lines.push(`09:${String(12 + i).padStart(2, '0')}:${String(10 + i * 4).padStart(2, '0')} ${host} A ${domain} NOERROR`);
  }
  lines.push(`09:31:47 ${normalHosts[0]} A updates.vendor.local NOERROR`);
  const difficulty = difficultyFor('networking', index);
  return {
    id: `dns-${seed}`,
    seed,
    type: 'DNS_BEACON',
    title: 'Повторяющийся DNS-запрос',
    client: pick(random, ['логистический офис', 'автосервис', 'частная клиника', 'небольшой провайдер']),
    factionId: pick(random, ['line', 'sfera']),
    factionName: '',
    skill: 'networking',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'В DNS-журнале есть повторяющиеся обращения. Найди узел и домен, которые выбиваются из обычного трафика.',
    constraint: 'Не блокируй весь DNS. Сначала выдели конкретный источник и имя.',
    files: [
      { name: 'dns.log', content: lines.join('\n') },
      { name: 'assets.txt', content: `${host} cashier-02\n${normalHosts[0]} manager-pc\n${normalHosts[1]} printer-01` },
    ],
    questions: [
      { id: 'host', label: 'Подозрительный узел', placeholder: 'IP-адрес', answers: [host] },
      { id: 'domain', label: 'Повторяющийся домен', placeholder: 'домен', answers: [domain] },
      { id: 'count', label: 'Число обращений', placeholder: 'Число', answers: [String(repeats)] },
    ],
    hint: 'grep -c по домену или IP сразу посчитает все совпадения.',
  };
}

function secretContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const secretName = pick(random, ['PAYMENTS_TOKEN', 'BACKUP_PASSWORD', 'BOT_API_KEY', 'SMTP_PASSWORD']);
  const secretValue = pick(random, ['sk_live_73JmQ9kX', 'winter-backup-26', 'bot_9281_secret', 'mailpass!4402']);
  const repo = pick(random, ['delivery-panel', 'warehouse-api', 'cashdesk-tools', 'support-bot']);
  const difficulty = difficultyFor('web', index);
  return {
    id: `secret-${seed}`,
    seed,
    type: 'EXPOSED_SECRET',
    title: 'Секрет в репозитории',
    client: pick(random, ['маленькая студия', 'подпольный магазин', 'служба курьеров', 'технический подрядчик']),
    factionId: pick(random, ['line', 'north', 'sfera']),
    factionName: '',
    skill: 'web',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `В архиве проекта ${repo} нашли конфигурационный файл. Проверь, есть ли в нём секрет, и укажи правильное первое действие.`,
    constraint: 'Не используй найденный секрет. Сразу подготовь его отзыв и замену.',
    files: [
      { name: '.env', content: `APP_ENV=production\nAPI_URL=https://api.${repo}.local\n${secretName}=${secretValue}\nLOG_LEVEL=info` },
      { name: '.gitignore', content: `node_modules/\ndist/\n*.log` },
      { name: 'README.md', content: `# ${repo}\nВнутренний сервис. Конфигурация загружается из .env.` },
    ],
    questions: [
      { id: 'name', label: 'Имя скомпрометированного секрета', placeholder: 'VARIABLE_NAME', answers: [secretName] },
      { id: 'value', label: 'Найденное значение', placeholder: 'значение', answers: [secretValue] },
      { id: 'action', label: 'Первое действие', placeholder: 'что сделать с секретом', answers: ['отозвать', 'ротировать', 'сменить', 'revoke', 'rotate'] },
    ],
    hint: 'cat .env покажет конфигурацию. Секрет, попавший в репозиторий, нужно считать скомпрометированным и заменить.',
  };
}

function webContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const source = ip(random);
  const path = pick(random, ['/admin/login', '/api/session', '/staff/auth', '/panel/sign-in']);
  const failures = Math.floor(random() * 6) + 7;
  const success = random() > .62;
  const lines: string[] = [];
  for (let i = 0; i < failures; i += 1) {
    lines.push(`${source} - - [16/Apr/2026:03:${String(10 + i).padStart(2, '0')}:22 +0300] "POST ${path} HTTP/1.1" 401 188 "-" "Mozilla/5.0"`);
  }
  if (success) lines.push(`${source} - - [16/Apr/2026:03:31:04 +0300] "POST ${path} HTTP/1.1" 302 0 "-" "Mozilla/5.0"`);
  lines.push(`10.22.4.18 - - [16/Apr/2026:03:33:11 +0300] "GET /health HTTP/1.1" 200 24 "-" "monitor/1.2"`);
  const difficulty = difficultyFor('soc', index);
  return {
    id: `web-${seed}`,
    seed,
    type: 'WEB_AUTH',
    title: 'Шум на форме входа',
    client: pick(random, ['панель склада', 'кассовый сервис', 'служебный портал', 'закрытый форум']),
    factionId: pick(random, ['north', 'sfera']),
    factionName: '',
    skill: 'soc',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'Веб-сервер зафиксировал серию запросов к форме входа. Определи источник, число отказов и наличие возможного успешного входа.',
    constraint: 'Не делай вывод о компрометации только по количеству запросов. Проверь коды ответа.',
    files: [{ name: 'access.log', content: lines.join('\n') }],
    questions: [
      { id: 'source', label: 'Источник', placeholder: 'IP-адрес', answers: [source] },
      { id: 'failures', label: 'Ответы 401', placeholder: 'Число', answers: [String(failures)] },
      { id: 'success', label: 'Есть ответ 302 после перебора?', placeholder: 'да / нет', answers: [success ? 'да' : 'нет', success ? 'yes' : 'no'] },
    ],
    hint: 'grep " 401 " access.log и grep " 302 " access.log разделят отказы и перенаправления.',
  };
}

function processContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const suspicious = pick(random, ['/tmp/.sys/update-worker', '/var/tmp/ksoftirqd-helper', '/home/operator/.cache/syncd', '/opt/tools/.agent']);
  const pid = Math.floor(random() * 5000) + 1100;
  const host = pick(random, ['cashier-03', 'office-07', 'dispatch-02', 'storage-gw']);
  const difficulty = difficultyFor('linux', index + 3);
  return {
    id: `proc-${seed}`,
    seed,
    type: 'PROCESS_TRIAGE',
    title: 'Неизвестный процесс',
    client: pick(random, ['склад', 'кассовая точка', 'диспетчерская', 'сервисный центр']),
    factionId: pick(random, ['line', 'north', 'sfera']),
    factionName: '',
    skill: 'linux',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `Узел ${host} тормозит после ночного обновления. Найди процесс, который запущен из нетипичного каталога.`,
    constraint: 'Не удаляй файл до фиксации пути и PID. Сначала сохрани данные.',
    files: [
      { name: 'processes.txt', content: `PID USER COMMAND\n1 root /sbin/init\n422 root /usr/sbin/sshd -D\n781 operator /usr/bin/firefox\n${pid} nobody ${suspicious} --silent\n2201 root /usr/local/bin/backup-agent` },
      { name: 'connections.txt', content: `${pid} tcp ESTABLISHED ${localIp(random)}:44718 ${ip(random)}:443` },
    ],
    questions: [
      { id: 'pid', label: 'PID', placeholder: 'Число', answers: [String(pid)] },
      { id: 'path', label: 'Путь процесса', placeholder: '/path/to/process', answers: [suspicious] },
      { id: 'first', label: 'Что сделать до удаления?', placeholder: 'первое действие', answers: ['сохранить', 'зафиксировать', 'снять копию', 'collect', 'preserve'] },
    ],
    hint: 'cat processes.txt. Нетипичные скрытые файлы часто начинаются с точки и запускаются из временных или пользовательских каталогов.',
  };
}


function pythonContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const failed = Math.floor(random() * 5) + 4;
  const success = Math.floor(random() * 4) + 2;
  const source = pick(random, ['import-worker', 'sync-agent', 'billing-job', 'mail-queue']);
  const rows: string[] = [];
  for (let i = 0; i < failed; i += 1) rows.push(JSON.stringify({ time: `11:${String(10 + i).padStart(2, '0')}`, job: source, status: 'failed', code: 503 }));
  for (let i = 0; i < success; i += 1) rows.push(JSON.stringify({ time: `12:${String(2 + i).padStart(2, '0')}`, job: source, status: 'ok', code: 200 }));
  const difficulty = difficultyFor('python', index);
  return {
    id: `python-${seed}`,
    seed,
    type: 'PYTHON_JSONL',
    title: 'Парсер очереди заданий',
    client: pick(random, ['служба доставки', 'расчётный сервис', 'почтовый шлюз', 'складская система']),
    factionId: pick(random, ['line', 'sfera']),
    factionName: '',
    skill: 'python',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'В JSONL-журнале смешаны успешные и неудачные задания. Напиши короткий Python-скрипт и посчитай записи со статусом failed.',
    constraint: 'Не меняй исходный файл. Скрипт должен читать данные построчно.',
    files: [{ name: 'events.jsonl', content: rows.join('\n') }],
    questions: [
      { id: 'count', label: 'Неудачные задания', placeholder: 'Число', answers: [String(failed)] },
      { id: 'job', label: 'Имя задания', placeholder: 'job name', answers: [source] },
      { id: 'format', label: 'Формат файла', placeholder: 'формат', answers: ['jsonl', 'json lines'] },
    ],
    hint: 'Используй json.loads(line), затем проверь event["status"] == "failed".',
    starterCode: `from pathlib import Path\nimport json\n\npath = Path("/home/pyodide/events.jsonl")\nfailed = 0\n\nfor line in path.read_text().splitlines():\n    event = json.loads(line)\n    # Добавь условие и увеличь failed.\n\nprint(f"Failed jobs: {failed}")\n`,
    expectedOutput: `Failed jobs: ${failed}`,
  };
}

const builders = [authContract, dnsContract, processContract, pythonContract, secretContract, webContract] as const;

function isSkillUnlocked(skill: ContractSkill, progress: ProgressState) {
  if (skill === 'linux') return progress.terminalObjectives.length >= 3;
  if (skill === 'python') return progress.pythonComplete;
  if (skill === 'networking') return progress.terminalObjectives.includes('inspect-processes');
  if (skill === 'soc') return progress.alertReviewed;
  if (skill === 'web') return progress.reportSubmitted;
  return false;
}

export function generateContractOffers(progress: ProgressState, refreshIndex = 0): GeneratedContract[] {
  const daySeed = Number(new Date().toISOString().slice(0, 10).replaceAll('-', ''));
  const baseSeed = daySeed + refreshIndex * 997 + progress.completedContracts.length * 131;
  const candidates = builders.map((builder, index) => builder(baseSeed + index * 7919, index + refreshIndex));
  const ordered = [...candidates].sort((a, b) => ((a.seed * 2654435761) >>> 0) - ((b.seed * 2654435761) >>> 0));
  const unlocked = ordered.filter((contract) => isSkillUnlocked(contract.skill, progress));
  const locked = ordered.filter((contract) => !isSkillUnlocked(contract.skill, progress));
  const chosen = [...unlocked, ...locked].slice(0, 3);
  return chosen.map((contract) => {
    const faction = factions.find((item) => item.id === contract.factionId) ?? factions[0];
    return { ...contract, factionName: faction.name };
  });
}

export function contractSkillUnlocked(contract: GeneratedContract, progress: ProgressState) {
  return isSkillUnlocked(contract.skill, progress);
}
