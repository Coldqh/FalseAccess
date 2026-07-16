import type { ContractDifficulty, ContractSkill, GeneratedContract, ProgressState } from '../types';
import { getContractAccess } from '../simulation/progression';

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
    constraint: 'Не используй найденные данные. Анализ проводится на учебной копии.',
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



function linuxPersistenceContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const host = pick(random, ['edge-node-03', 'settlement-02', 'gateway-bet-05', 'mirror-api-01']);
  const user = pick(random, ['cache-agent', 'metrics-node', 'sync-worker', 'backup-watch']);
  const remote = ip(random);
  const mechanism = pick(random, ['cron', 'systemd']);
  const unit = `${user}.service`;
  const command = `/usr/local/lib/.${user} --push`;
  const difficulty: ContractDifficulty = index % 3 === 0 ? 'HARD' : 'STANDARD';
  return {
    id: `linux-persistence-${seed}`,
    seed,
    type: 'LINUX_PERSISTENCE',
    title: mechanism === 'cron' ? 'Подозрительная cron-задача' : 'Неизвестная systemd-служба',
    client: pick(random, ['серый расчётный узел', 'закрытая кассовая сеть', 'ставочный шлюз', 'частный хостинг']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'linux',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `На ${host} после перезапуска возвращается неизвестный процесс. Найди учётку, механизм запуска и внешний адрес.`,
    constraint: 'Работай по копии артефактов. Сначала зафиксируй данные, потом предлагай удаление.',
    files: [
      { name: 'passwd.txt', content: `root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n${user}:x:1014:1014:System Worker:/var/lib/${user}:/bin/bash` },
      { name: mechanism === 'cron' ? 'cron.txt' : 'unit.txt', content: mechanism === 'cron' ? `*/4 * * * * ${user} ${command}` : `[Service]\nUser=${user}\nExecStart=${command}\nRestart=always` },
      { name: 'sockets.txt', content: `ESTAB 0 0 10.71.4.18:49122 ${remote}:8443 users:((\".${user}\",pid=4188,fd=5))` },
      { name: 'auth.log', content: `Accepted publickey for operator from ${remote}\nsudo: operator : USER=root ; COMMAND=/usr/sbin/useradd -m -s /bin/bash ${user}` },
    ],
    questions: [
      { id: 'account', label: 'Подозрительная учётка', placeholder: 'username', answers: [user] },
      { id: 'mechanism', label: 'Механизм закрепления', placeholder: 'cron / systemd', answers: [mechanism] },
      { id: 'remote', label: 'Внешний адрес', placeholder: 'IP-адрес', answers: [remote] },
    ],
    hint: 'Сравни passwd.txt, файл запуска и PID в sockets.txt. Интерактивный shell у неизвестной сервисной учётки требует проверки.',
  };
}


function windowsContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const host = pick(random, ['FIN-WS-03', 'OPS-WS-09', 'CASH-WS-14', 'DISPATCH-06']);
  const user = pick(random, ['operator', 'accountant', 'dispatcher', 'manager']);
  const parent = pick(random, ['WINWORD.EXE', 'OUTLOOK.EXE', 'wscript.exe']);
  const suspicious = pick(random, ['sync_host.exe', 'invoice_viewer.exe', 'office_helper.exe', 'update_worker.exe']);
  const pid = Math.floor(random() * 3500) + 3200;
  const remote = ip(random);
  const hash = `${Math.floor(random() * 1e16).toString(16).padStart(16, 'A')}${Math.floor(random() * 1e16).toString(16).padStart(16, 'B')}${Math.floor(random() * 1e16).toString(16).padStart(16, 'C')}${Math.floor(random() * 1e16).toString(16).padStart(16, 'D')}`.slice(0, 64).toUpperCase();
  const difficulty = difficultyFor('windows', index + 1);
  return {
    id: `windows-${seed}`,
    seed,
    type: 'WINDOWS_TRIAGE',
    title: 'Цепочка процессов Windows',
    client: pick(random, ['складская касса', 'диспетчерская', 'серый расчётный офис', 'логистическая точка']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'windows',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `На ${host} после открытия документа появился неизвестный процесс. Свяжи родителя, PID, сетевой адрес и хэш файла.`,
    constraint: 'Работай с изолированным снимком. Не удаляй файл до фиксации артефактов.',
    files: [
      { name: 'processes.txt', content: `PID PPID USER NAME COMMANDLINE\n2200 1044 ${user} ${parent} ${parent}\n${pid} 2200 ${user} powershell.exe powershell.exe -NoProfile -File C:\\\\Users\\\\${user}\\\\AppData\\\\Local\\\\Temp\\\\check.ps1\n${pid + 91} ${pid} ${user} ${suspicious} ${suspicious} --background` },
      { name: 'security-4688.log', content: `EventID=4688 Host=${host} User=${user} Parent=${parent} NewProcess=powershell.exe PID=${pid}\nEventID=4688 Host=${host} User=${user} Parent=powershell.exe NewProcess=${suspicious} PID=${pid + 91}` },
      { name: 'network.txt', content: `OwningProcess=${pid + 91} RemoteAddress=${remote} RemotePort=443 State=Established` },
      { name: 'hash.txt', content: `SHA256 ${hash} C:\\\\Users\\\\${user}\\\\AppData\\\\Local\\\\Temp\\\\${suspicious}` },
    ],
    questions: [
      { id: 'process', label: 'Подозрительный процесс', placeholder: 'filename.exe', answers: [suspicious] },
      { id: 'remote', label: 'Внешний адрес', placeholder: 'IP-адрес', answers: [remote] },
      { id: 'hash', label: 'SHA-256', placeholder: '64 символа', answers: [hash] },
    ],
    hint: 'Сначала cat processes.txt. Затем свяжи дочерний PID с OwningProcess в network.txt и проверь hash.txt.',
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

function timelineContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const session = `sid_${Math.floor(random() * 9000) + 1000}`;
  const internal = localIp(random);
  const external = ip(random);
  const user = pick(random, ['operator', 'dispatcher', 'manager', 'support']);
  const rows = [
    JSON.stringify({ time: '18:22:11', event: 'session_created', user, ip: internal, session }),
    JSON.stringify({ time: '02:08:44', event: 'session_used', user, ip: external, session }),
    JSON.stringify({ time: '02:09:02', event: 'admin_opened', user, ip: external, session, path: '/admin' }),
  ];
  const difficulty = difficultyFor('web', index + 2);
  return {
    id: `timeline-${seed}`,
    seed,
    type: 'WEB_TIMELINE',
    title: 'Повторное использование сессии',
    client: pick(random, ['служба доставки', 'панель склада', 'сервис заявок', 'личный кабинет дилеров']),
    factionId: pick(random, ['line', 'sfera']),
    factionName: '',
    skill: 'web',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'В JSONL смешаны создание сессии и поздние запросы. Восстанови временную линию и найди внешний адрес.',
    constraint: 'Работай только с копией. Не проверяй действительность cookie.',
    files: [{ name: 'timeline.jsonl', content: rows.join('\n') }],
    questions: [
      { id: 'session', label: 'Идентификатор сессии', placeholder: 'session id', answers: [session] },
      { id: 'external', label: 'Внешний адрес', placeholder: 'IP', answers: [external] },
      { id: 'verdict', label: 'Что произошло?', placeholder: 'краткий вывод', answers: ['повторное использование сессии', 'использование сессии', 'session reuse'] },
    ],
    hint: 'Сначала отсортируй строки по time, затем сравни одинаковое поле session у разных IP.',
    starterCode: `from pathlib import Path\nimport json\n\nevents = [json.loads(line) for line in Path("/home/pyodide/timeline.jsonl").read_text().splitlines()]\nevents.sort(key=lambda event: event["time"])\nfor event in events:\n    print(event["time"], event["event"], event["ip"], event["session"])\n`,
    expectedOutput: external,
  };
}


function networkSegmentContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const vlan = pick(random, [10, 20, 30, 40]);
  const subnet = `10.${Math.floor(random() * 30) + 40}.${vlan}.0/24`;
  const host = `10.${Math.floor(random() * 30) + 40}.${vlan}.${Math.floor(random() * 180) + 20}`;
  const trustedGateway = host.split('.').slice(0, 3).concat('1').join('.');
  const rogueGateway = host.split('.').slice(0, 3).concat('254').join('.');
  const remote = ip(random);
  const mac = `02:42:${Math.floor(random() * 255).toString(16).padStart(2, '0')}:${Math.floor(random() * 255).toString(16).padStart(2, '0')}:${Math.floor(random() * 255).toString(16).padStart(2, '0')}:${Math.floor(random() * 255).toString(16).padStart(2, '0')}`;
  const difficulty: ContractDifficulty = index % 3 === 0 ? 'HARD' : 'STANDARD';
  return {
    id: `network-segment-${seed}`,
    seed,
    type: 'NETWORK_SEGMENT',
    title: 'Чужой gateway в сегменте',
    client: pick(random, ['закрытый склад', 'диспетчерская', 'серый расчётный офис', 'частный дата-узел']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'networking',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `В ${subnet} один клиент получил сетевые параметры от второго DHCP-сервера. Найди rogue gateway, MAC и внешний адрес соединения.`,
    constraint: 'Не отключай весь VLAN. Работай по копии DHCP, ARP и flow-журналов.',
    files: [
      { name: 'dhcp.log', content: `ACK host=${host} server=${trustedGateway} router=${trustedGateway} dns=10.44.0.53\nOFFER host=${host} server=${rogueGateway} router=${rogueGateway} dns=${rogueGateway}` },
      { name: 'neighbors.txt', content: `${rogueGateway} dev vlan${vlan} lladdr ${mac} REACHABLE` },
      { name: 'flows.txt', content: `${host}:53188 -> ${remote}:443 tcp packets=91 bytes=138442` },
    ],
    questions: [
      { id: 'gateway', label: 'Подозрительный gateway', placeholder: 'IP-адрес', answers: [rogueGateway] },
      { id: 'mac', label: 'MAC устройства', placeholder: 'aa:bb:cc:dd:ee:ff', answers: [mac] },
      { id: 'remote', label: 'Внешний адрес', placeholder: 'IP-адрес', answers: [remote] },
    ],
    hint: 'Сначала сравни server/router в dhcp.log. Затем найди этот IP в neighbors.txt и свяжи клиента с flows.txt.',
  };
}


function apiAuthorizationContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const user = Math.floor(random() * 40) + 10;
  const foreignOwner = user + 1;
  const ownObject = Math.floor(random() * 700) + 100;
  const foreignObject = ownObject + 1;
  const resource = pick(random, ['invoice', 'shipment', 'document', 'payout']);
  const difficulty: ContractDifficulty = index % 3 === 0 ? 'HARD' : 'STANDARD';
  return {
    id: `api-authz-${seed}`,
    seed,
    type: 'API_AUTHORIZATION',
    title: 'Чужой объект через API',
    client: pick(random, ['расчётный портал', 'закрытый склад', 'сервис документов', 'панель выплат']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'web',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `Аккаунт user-${user} открыл ${resource} другого владельца. Определи объект, владельца и отсутствующую проверку.`,
    constraint: 'Работай с синтетической копией API. Не используй идентификаторы вне стенда.',
    files: [
      { name: 'requests.log', content: `GET /api/v1/me sid=sid_${user} -> 200 user_id=${user}\nGET /api/v1/${resource}s/${ownObject} sid=sid_${user} -> 200 owner_id=${user}\nGET /api/v1/${resource}s/${foreignObject} sid=sid_${user} -> 200 owner_id=${foreignOwner}` },
      { name: 'route.js', content: `router.get('/${resource}s/:id', requireSession, async (req, res) => {\n  const row = await db.oneOrNone('SELECT * FROM ${resource}s WHERE id = $1', [req.params.id])\n  res.json(row)\n})` },
    ],
    questions: [
      { id: 'object', label: 'Чужой объект', placeholder: 'ID', answers: [String(foreignObject)] },
      { id: 'owner', label: 'Фактический владелец', placeholder: 'user id', answers: [String(foreignOwner)] },
      { id: 'fix', label: 'Недостающая проверка', placeholder: 'кратко', answers: ['owner_id', 'проверка владельца', 'авторизация объекта', 'object authorization'] },
    ],
    hint: 'Сравни user_id текущей сессии с owner_id каждого объекта. requireSession подтверждает личность, но не право на строку.',
  };
}

function sqlReviewContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const table = pick(random, ['payments', 'orders', 'files', 'tickets']);
  const difficulty: ContractDifficulty = index % 2 === 0 ? 'STANDARD' : 'HARD';
  return {
    id: `sql-review-${seed}`,
    seed,
    type: 'SQL_QUERY_REVIEW',
    title: 'Опасный запрос к базе',
    client: pick(random, ['внутренний API', 'служба расчётов', 'архив документов', 'панель операторов']),
    factionId: pick(random, ['line', 'north']),
    factionName: '',
    skill: 'web',
    difficulty,
    pay: payFor(difficulty, random),
    summary: `В маршруте таблицы ${table} найден SQL, собранный строкой. Укажи опасный фрагмент и безопасный принцип исправления.`,
    constraint: 'Ничего не выполняй. Это ревью кода на локальной копии.',
    files: [
      { name: 'handler.js', content: `const query = "SELECT * FROM ${table} WHERE id = " + req.params.id\nconst row = await db.query(query)\nreturn res.json(row.rows[0])` },
      { name: 'safe-example.js', content: `const row = await db.query('SELECT * FROM ${table} WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id])` },
    ],
    questions: [
      { id: 'problem', label: 'Опасный приём', placeholder: 'что не так', answers: ['конкатенация', 'склейка строки', 'string concatenation'] },
      { id: 'sql', label: 'Безопасный принцип SQL', placeholder: 'что использовать', answers: ['параметры', 'параметризованный запрос', 'prepared statement'] },
      { id: 'authz', label: 'Что ещё проверять', placeholder: 'доступ к объекту', answers: ['owner_id', 'владельца', 'авторизацию', 'права доступа'] },
    ],
    hint: 'Параметризованный запрос отделяет данные от SQL. Отдельно ограничь строку владельцем или политикой доступа.',
  };
}


function mobileProfileContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const packageName = pick(random, ['com.quickmemo.mobile', 'net.routeassist.app', 'com.lighttools.scan']);
  const specialAccess = pick(random, ['Accessibility', 'Device Admin', 'Notification Listener']);
  const remote = ip(random);
  const difficulty: ContractDifficulty = index % 3 === 0 ? 'HARD' : 'STANDARD';
  return {
    id: `mobile-profile-${seed}`,
    seed,
    type: 'MOBILE_PROFILE',
    title: 'Посторонний профиль на телефоне',
    client: pick(random, ['курьерская сеть', 'закрытая диспетчерская', 'частный перевозчик']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'mobile',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'В образе телефона найден сторонний пакет со специальным доступом и внешним соединением. Свяжи пакет, полномочие и адрес.',
    constraint: 'Работай только с синтетическим образом. Не подключайся к внешнему адресу.',
    files: [
      { name: 'packages.txt', content: `package=${packageName}\ninstaller=com.android.packageinstaller\ninstalled=02:14:09` },
      { name: 'special_access.txt', content: `package=${packageName}\naccess=${specialAccess}\nstate=enabled` },
      { name: 'network.log', content: `package=${packageName} remote=${remote}:443 bytes=44821` },
    ],
    questions: [
      { id: 'package', label: 'Подозрительный пакет', placeholder: 'package name', answers: [packageName] },
      { id: 'access', label: 'Специальный доступ', placeholder: 'тип доступа', answers: [specialAccess] },
      { id: 'remote', label: 'Внешний адрес', placeholder: 'IP', answers: [remote] },
    ],
    hint: 'Сопоставь package во всех трёх файлах. Специальный доступ важнее обычного списка permissions.',
  };
}

function mobileTokenContract(seed: number, index: number): GeneratedContract {
  const random = mulberry32(seed);
  const account = `courier-${Math.floor(random() * 70) + 10}`;
  const token = `rt_${Math.floor(random() * 9000) + 1000}_${Math.floor(random() * 0xffffff).toString(36).padStart(4, '0').slice(0, 4)}`;
  const remote = ip(random);
  const difficulty: ContractDifficulty = index % 2 === 0 ? 'STANDARD' : 'HARD';
  return {
    id: `mobile-token-${seed}`,
    seed,
    type: 'MOBILE_TOKEN_BACKUP',
    title: 'Токен в резервной копии',
    client: pick(random, ['мобильная бригада', 'служба маршрутов', 'оператор склада']),
    factionId: pick(random, ['north', 'line']),
    factionName: '',
    skill: 'mobile',
    difficulty,
    pay: payFor(difficulty, random),
    summary: 'В незашифрованной резервной копии найден refresh token. Проверь его удалённое использование и назови первое действие.',
    constraint: 'Не используй токен. Анализируй только копию журналов.',
    files: [
      { name: 'backup_manifest.txt', content: `encrypted=false\ncontains=shared_prefs/session.xml` },
      { name: 'session.xml', content: `<string name="account">${account}</string>\n<string name="refresh_token">${token}</string>` },
      { name: 'oauth.log', content: `token=${token} account=${account} ip=${remote} result=access_issued\naccount=${account} ip=${remote} POST /export 200` },
    ],
    questions: [
      { id: 'token', label: 'Refresh token', placeholder: 'token', answers: [token] },
      { id: 'remote', label: 'Удалённый адрес', placeholder: 'IP', answers: [remote] },
      { id: 'action', label: 'Первое действие', placeholder: 'что отозвать', answers: ['отозвать токен', 'отозвать refresh token', 'отозвать сессии', 'revoke token'] },
    ],
    hint: 'Сначала найди token в session.xml, затем тот же token в oauth.log. После подтверждения его нужно отозвать вместе с дочерними сессиями.',
  };
}

const builders = [authContract, dnsContract, networkSegmentContract, processContract, linuxPersistenceContract, windowsContract, pythonContract, secretContract, webContract, timelineContract, apiAuthorizationContract, sqlReviewContract, mobileProfileContract, mobileTokenContract] as const;


export function generateContractOffers(progress: ProgressState, refreshIndex = 0): GeneratedContract[] {
  const daySeed = Number(progress.simulation.clock.dateIso.replaceAll('-', ''));
  const baseSeed = daySeed + refreshIndex * 997 + progress.completedContracts.length * 131;
  const candidates = builders
    .map((builder, index) => builder(baseSeed + index * 7919, index + refreshIndex))
    .filter((contract) => progress.routeCaseComplete || contract.type !== 'WEB_TIMELINE')
    .filter((contract) => progress.windowsCaseComplete || contract.type !== 'WINDOWS_TRIAGE')
    .filter((contract) => progress.linuxCaseComplete || contract.type !== 'LINUX_PERSISTENCE')
    .filter((contract) => progress.networkCaseComplete || contract.type !== 'NETWORK_SEGMENT')
    .filter((contract) => progress.webCaseComplete || !['API_AUTHORIZATION', 'SQL_QUERY_REVIEW'].includes(contract.type))
    .filter((contract) => progress.mobileCaseComplete || !['MOBILE_PROFILE', 'MOBILE_TOKEN_BACKUP'].includes(contract.type));
  const ordered = [...candidates].sort((a, b) => ((a.seed * 2654435761) >>> 0) - ((b.seed * 2654435761) >>> 0));
  const unlocked = ordered.filter((contract) => getContractAccess(contract, progress).available);
  const locked = ordered.filter((contract) => !getContractAccess(contract, progress).available);
  const chosen = [...unlocked, ...locked].slice(0, 3);
  return chosen.map((contract) => {
    const faction = factions.find((item) => item.id === contract.factionId) ?? factions[0];
    const durationSlots = contract.difficulty === 'HARD' ? 2 : 1;
    const deadlineOffset = contract.difficulty === 'STARTER' ? 2 : contract.difficulty === 'STANDARD' ? 2 : 3;
    const risk = contract.factionId === 'north' ? 'HIGH' : contract.difficulty === 'HARD' ? 'MEDIUM' : 'LOW';
    return {
      ...contract,
      factionName: faction.name,
      postedDay: progress.simulation.clock.day,
      deadlineDay: progress.simulation.clock.day + deadlineOffset,
      durationSlots,
      risk,
    };
  });
}

export function contractSkillUnlocked(contract: GeneratedContract, progress: ProgressState) {
  return getContractAccess(contract, progress).available;
}
