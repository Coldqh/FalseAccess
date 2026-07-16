export const linuxServerOverview = [
  { label: 'HOST', value: 'BET-CORE-02' },
  { label: 'OS', value: 'Debian 13' },
  { label: 'ROLE', value: 'odds-api / settlement queue' },
  { label: 'ADDRESS', value: '10.71.2.14' },
  { label: 'OWNER', value: '«Красный стол»' },
  { label: 'STATE', value: 'traffic moved to reserve node' },
] as const;

export const linuxAccountSnapshot = `root:x:0:0:root:/root:/bin/bash
deploy:x:1001:1001:Deploy User:/home/deploy:/bin/bash
odds:x:998:998:Odds Service:/srv/odds:/usr/sbin/nologin
backup:x:997:997:Backup Service:/var/lib/backup:/usr/sbin/nologin
metricsd:x:1007:1007:System Metrics:/var/lib/metricsd:/bin/bash`;

export const linuxAuthLog = `Apr 18 00:41:09 bet-core-02 sshd[4112]: Accepted publickey for deploy from 10.71.0.18 port 51822 ssh2: ED25519 SHA256:ADMIN-LAPTOP
Apr 18 01:03:17 bet-core-02 sshd[4370]: Accepted publickey for deploy from 198.51.100.42 port 44711 ssh2: ED25519 SHA256:UNKNOWN-KEY
Apr 18 01:04:02 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/sbin/useradd -m -d /var/lib/metricsd -s /bin/bash metricsd
Apr 18 01:04:18 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/install -m 600 /tmp/k /var/lib/metricsd/.ssh/authorized_keys
Apr 18 01:06:43 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/opt/odds ; USER=root ; COMMAND=/usr/bin/cp /tmp/odds-sync.service /etc/systemd/system/odds-sync.service
Apr 18 01:06:51 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/opt/odds ; USER=root ; COMMAND=/usr/bin/systemctl daemon-reload
Apr 18 01:06:55 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/opt/odds ; USER=root ; COMMAND=/usr/bin/systemctl enable --now odds-sync.service
Apr 18 01:11:28 bet-core-02 sudo: deploy : TTY=pts/2 ; PWD=/opt/odds ; USER=root ; COMMAND=/usr/bin/systemctl restart odds-api.service
Apr 18 01:14:09 bet-core-02 sshd[4370]: Disconnected from user deploy 198.51.100.42 port 44711`;

export const linuxServiceStatus = `● odds-api.service - Odds API
     Loaded: loaded (/etc/systemd/system/odds-api.service; enabled)
     Active: active (running) since Fri 2029-04-18 01:11:29 MSK; 2h 19min ago
   Main PID: 2844 (odds-api)
      Tasks: 14
     Memory: 196.3M
        CPU: 6min 18.410s
     CGroup: /system.slice/odds-api.service
             └─2844 /opt/odds/bin/odds-api --config /etc/odds/api.toml

Apr 18 01:11:28 bet-core-02 systemd[1]: Stopping odds-api.service - Odds API...
Apr 18 01:11:29 bet-core-02 systemd[1]: Started odds-api.service - Odds API.`;

export const linuxJournalOutput = `Apr 18 00:58:00 bet-core-02 odds-api[2061]: settlement queue size=14
Apr 18 01:08:11 bet-core-02 odds-api[2061]: warning: config checksum changed
Apr 18 01:11:28 bet-core-02 systemd[1]: Stopping odds-api.service - Odds API...
Apr 18 01:11:29 bet-core-02 odds-api[2844]: loaded config /etc/odds/api.toml
Apr 18 01:11:29 bet-core-02 odds-api[2844]: settlement queue size=0
Apr 18 01:12:06 bet-core-02 odds-api[2844]: partner feed connected
Apr 18 01:12:11 bet-core-02 odds-api[2844]: warning: 183 queued settlements absent after restart`;

export const linuxCronOutput = `# /etc/cron.d/metrics-sync
*/5 * * * * metricsd /usr/local/lib/.metrics-sync --push >/dev/null 2>&1`;

export const linuxSocketsOutput = `State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      4096   10.71.2.14:443    0.0.0.0:*      users:(("odds-api",pid=2844,fd=9))
LISTEN 0      128    0.0.0.0:22        0.0.0.0:*      users:(("sshd",pid=742,fd=3))
ESTAB  0      0      10.71.2.14:47732  203.0.113.91:8443 users:((".metrics-sync",pid=3019,fd=6))
ESTAB  0      0      10.71.2.14:443    10.71.1.33:53118 users:(("odds-api",pid=2844,fd=12))`;

export const linuxChangedFilesOutput = `140104 4 -rw-r--r-- 1 root root  312 Apr 18 01:06 /etc/systemd/system/odds-sync.service
131911 4 -rw-r----- 1 root odds 1489 Apr 18 01:08 /etc/odds/api.toml
140111 4 -rw-r--r-- 1 root root  101 Apr 18 01:07 /etc/cron.d/metrics-sync
266210 20 -rwxr-xr-x 1 root root 18432 Apr 18 01:05 /usr/local/lib/.metrics-sync
409992 4 -rw------- 1 metricsd metricsd 102 Apr 18 01:04 /var/lib/metricsd/.ssh/authorized_keys`;

export const linuxGuidedObjectives = [
  {
    id: 'accounts',
    title: 'Проверь локальные учётные записи',
    explanation: 'getent passwd читает системную базу пользователей. Обрати внимание на UID, домашний каталог и shell. Сервисным аккаунтам интерактивный shell обычно не нужен.',
    command: 'getent passwd',
    output: linuxAccountSnapshot,
  },
  {
    id: 'auth',
    title: 'Найди успешные SSH-входы и sudo',
    explanation: 'auth.log связывает удалённый адрес, учётку и команды с повышенными правами. Сначала восстанавливаем последовательность, а не блокируем всё подряд.',
    command: `grep -E "Accepted|sudo:" /var/log/auth.log`,
    output: linuxAuthLog,
  },
  {
    id: 'service',
    title: 'Проверь основную службу',
    explanation: 'systemctl status показывает состояние, PID, путь к unit-файлу и последние записи. Перезапуск сам по себе не объясняет пропавшие ставки.',
    command: 'systemctl status odds-api.service --no-pager',
    output: linuxServiceStatus,
  },
  {
    id: 'journal',
    title: 'Прочитай журнал службы',
    explanation: 'journalctl фильтрует события конкретной службы. Здесь важны изменение контрольной суммы, момент перезапуска и состояние очереди после запуска.',
    command: `journalctl -u odds-api.service --since "2029-04-18 00:30" --no-pager`,
    output: linuxJournalOutput,
  },
  {
    id: 'cron',
    title: 'Проверь задания cron',
    explanation: 'cron запускает команды по расписанию. Задание от неизвестного пользователя может возвращать доступ даже после остановки процесса.',
    command: 'cat /etc/cron.d/metrics-sync',
    output: linuxCronOutput,
  },
  {
    id: 'sockets',
    title: 'Свяжи процесс с сетью',
    explanation: 'ss -plant показывает соединения, PID и имя процесса. Это позволяет связать скрытый бинарник с внешним адресом.',
    command: 'ss -plant',
    output: linuxSocketsOutput,
  },
  {
    id: 'changed',
    title: 'Найди изменённые файлы',
    explanation: 'Поиск по времени помогает проверить конфиги, unit-файлы, cron и ключи, изменённые в окно инцидента.',
    command: `find /etc /usr/local/lib /var/lib/metricsd -xdev -type f -newermt "2029-04-18 00:30" -ls 2>/dev/null`,
    output: linuxChangedFilesOutput,
  },
] as const;

export const linuxArchitectureQuestions = [
  {
    id: 'account', label: 'Какая учётная запись требует проверки?', options: [
      { id: 'metricsd', text: 'metricsd: UID 1007, домашний каталог /var/lib/metricsd и интерактивный /bin/bash.', correct: true },
      { id: 'odds', text: 'odds: сервисная учётка с /usr/sbin/nologin.' },
      { id: 'root', text: 'root существует на Linux, значит сервер уже взломан.' },
    ],
  },
  {
    id: 'privilege', label: 'Что дало возможность менять систему?', options: [
      { id: 'sudo', text: 'Учётка deploy использовала sudo для создания пользователя, установки unit-файла и запуска службы.', correct: true },
      { id: 'port', text: 'Сам факт открытого порта 443.' },
      { id: 'service', text: 'Наличие systemd на сервере.' },
    ],
  },
  {
    id: 'loss', label: 'Почему пропажа ставок связана с перезапуском?', options: [
      { id: 'queue', text: 'До перезапуска была очередь, после запуска она стала пустой, а журнал фиксирует отсутствие 183 расчётов.', correct: true },
      { id: 'proof', text: 'Любой restart всегда удаляет базу данных.' },
      { id: 'ssh', text: 'Потому что SSH работает на порту 22.' },
    ],
  },
] as const;

export const linuxScriptStarter = `#!/usr/bin/env bash
# read-only collector for BET-CORE-02

# [1] БЕЗОПАСНЫЙ РЕЖИМ

# [2] КАТАЛОГ РЕЗУЛЬТАТА

# [3] УЧЁТНЫЕ ЗАПИСИ И SSH

# [4] СЛУЖБЫ И ЖУРНАЛЫ

# [5] CRON, СЕТЬ И ИЗМЕНЁННЫЕ ФАЙЛЫ

# [6] АРХИВ
`;

export const linuxScriptSteps = [
  {
    id: 'strict', marker: '# [1] БЕЗОПАСНЫЙ РЕЖИМ', title: 'Включи строгий режим',
    text: 'set -euo pipefail останавливает скрипт при ошибке, несуществующей переменной и падении команды в пайпе. Так сборщик не выдаёт неполный архив как успешный.',
    snippet: 'set -euo pipefail',
    check: /set\s+-euo\s+pipefail/i,
  },
  {
    id: 'output', marker: '# [2] КАТАЛОГ РЕЗУЛЬТАТА', title: 'Создай каталог артефактов',
    text: 'Переменная хранит путь один раз. mkdir -p создаёт каталог без ошибки, если он уже существует.',
    snippet: `OUT="/tmp/bet-core-02-evidence"
mkdir -p "$OUT"`,
    check: /OUT=["']\/tmp\/bet-core-02-evidence["'][\s\S]*mkdir\s+-p\s+["']?\$OUT/i,
  },
  {
    id: 'accounts', marker: '# [3] УЧЁТНЫЕ ЗАПИСИ И SSH', title: 'Сохрани пользователей и auth.log',
    text: 'Перенаправление > записывает вывод в новый файл. grep оставляет успешные входы и sudo-команды.',
    snippet: `getent passwd > "$OUT/passwd.txt"
grep -E "Accepted|sudo:" /var/log/auth.log > "$OUT/auth-events.txt"`,
    check: /getent\s+passwd[\s\S]*auth\.log[\s\S]*auth-events\.txt/i,
  },
  {
    id: 'services', marker: '# [4] СЛУЖБЫ И ЖУРНАЛЫ', title: 'Сохрани состояние служб',
    text: 'systemctl cat фиксирует фактический unit-файл, а journalctl — события основной и подозрительной служб за нужное время.',
    snippet: `systemctl cat odds-api.service odds-sync.service > "$OUT/units.txt"
journalctl -u odds-api.service -u odds-sync.service --since "2029-04-18 00:30" --no-pager > "$OUT/journal.txt"`,
    check: /systemctl\s+cat[\s\S]*odds-sync\.service[\s\S]*journalctl[\s\S]*journal\.txt/i,
  },
  {
    id: 'host', marker: '# [5] CRON, СЕТЬ И ИЗМЕНЁННЫЕ ФАЙЛЫ', title: 'Собери закрепление и сеть',
    text: 'cp сохраняет cron-файл, ss связывает процессы с соединениями, find фиксирует файлы из окна инцидента.',
    snippet: `cp /etc/cron.d/metrics-sync "$OUT/"
ss -plant > "$OUT/sockets.txt"
find /etc /usr/local/lib /var/lib/metricsd -xdev -type f -newermt "2029-04-18 00:30" -ls 2>/dev/null > "$OUT/changed-files.txt"`,
    check: /cron\.d\/metrics-sync[\s\S]*ss\s+-plant[\s\S]*find\s+\/etc[\s\S]*changed-files\.txt/i,
  },
  {
    id: 'archive', marker: '# [6] АРХИВ', title: 'Упакуй результат',
    text: 'tar создаёт один архив для передачи. Исходные файлы сервера при этом не меняются.',
    snippet: `tar -czf /tmp/bet-core-02-evidence.tar.gz -C /tmp bet-core-02-evidence
echo "Evidence: /tmp/bet-core-02-evidence.tar.gz"`,
    check: /tar\s+-czf\s+\/tmp\/bet-core-02-evidence\.tar\.gz[\s\S]*echo/i,
  },
] as const;

export const linuxCollectorOutput = `collector: strict mode enabled
accounts: 5 entries saved
auth: 9 relevant records saved
units: odds-api.service, odds-sync.service
journal: 18 records saved
persistence: metrics-sync cron saved
network: 4 sockets saved
changed files: 5 records saved
Evidence: /tmp/bet-core-02-evidence.tar.gz`;

export const linuxContainmentSections = [
  {
    id: 'preserve', label: 'Что сделать до изменений?', options: [
      { id: 'snapshot', text: 'Сохранить auth.log, journal, unit-файлы, cron, ключи, сетевые соединения и копию изменённого конфига.', correct: true },
      { id: 'clean', text: 'Очистить журналы и удалить подозрительные файлы.' },
      { id: 'reboot', text: 'Сразу перезагрузить сервер.' },
    ],
  },
  {
    id: 'access', label: 'Как закрыть подтверждённый доступ?', options: [
      { id: 'lock', text: 'Заблокировать metricsd, убрать его ключ, отозвать неизвестный ключ deploy и проверить разрешённые sudo-команды.', correct: true },
      { id: 'root', text: 'Удалить root и отключить все учётные записи.' },
      { id: 'ssh', text: 'Оставить SSH как есть, потому что внешний вход уже завершён.' },
    ],
  },
  {
    id: 'persistence', label: 'Как убрать закрепление?', options: [
      { id: 'disable', text: 'Остановить и отключить odds-sync.service, убрать cron после копирования и проверить другие механизмы запуска.', correct: true },
      { id: 'binary', text: 'Удалить только .metrics-sync и считать работу законченной.' },
      { id: 'api', text: 'Остановить только odds-api.' },
    ],
  },
  {
    id: 'restore', label: 'Как восстановить расчётный сервис?', options: [
      { id: 'known', text: 'Вернуть проверенный api.toml, проверить очередь и резервную копию, затем контролируемо перезапустить odds-api.', correct: true },
      { id: 'restart', text: 'Несколько раз перезапустить сервис, пока ошибки не исчезнут.' },
      { id: 'live', text: 'Редактировать базу ставок вручную на рабочем сервере.' },
    ],
  },
] as const;

export const linuxIndependentCommands = [
  {
    id: 'accounts', command: 'getent passwd',
    output: `root:x:0:0:root:/root:/bin/bash
operator:x:1001:1001:Operator:/home/operator:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
system-cache:x:1012:1012:System Cache:/var/cache/system-cache:/bin/bash`,
  },
  {
    id: 'auth', command: `grep -E "Accepted|sudo:" /var/log/auth.log`,
    output: `Apr 18 02:22:14 edge-bet-04 sshd[7181]: Accepted password for operator from 203.0.113.117 port 50118 ssh2
Apr 18 02:23:02 edge-bet-04 sudo: operator : USER=root ; COMMAND=/usr/bin/install -m 644 /tmp/cache-refresh.timer /etc/systemd/system/cache-refresh.timer
Apr 18 02:23:08 edge-bet-04 sudo: operator : USER=root ; COMMAND=/usr/bin/systemctl enable --now cache-refresh.timer`,
  },
  {
    id: 'timers', command: 'systemctl list-timers --all',
    output: `NEXT                        LEFT LAST                        PASSED UNIT                 ACTIVATES
Fri 2029-04-18 03:45:00 MSK 3min Fri 2029-04-18 03:40:00 1min ago cache-refresh.timer  cache-refresh.service
Fri 2029-04-18 04:00:00 MSK 18min Fri 2029-04-18 03:00:00 41min ago logrotate.timer      logrotate.service`,
  },
  {
    id: 'network', command: 'ss -plant',
    output: `ESTAB 0 0 10.71.2.22:55218 198.51.100.119:9443 users:(("cache-refresh",pid=3914,fd=5))
LISTEN 0 4096 10.71.2.22:443 0.0.0.0:* users:(("nginx",pid=811,fd=7))`,
  },
  {
    id: 'changed', command: `find /etc/systemd/system /var/cache/system-cache -type f -newermt "2029-04-18 02:00" -ls`,
    output: `511410 4 -rw-r--r-- 1 root root 178 Apr 18 02:23 /etc/systemd/system/cache-refresh.timer
511411 4 -rw-r--r-- 1 root root 266 Apr 18 02:23 /etc/systemd/system/cache-refresh.service
721143 4 -rw------- 1 system-cache system-cache 102 Apr 18 02:22 /var/cache/system-cache/.ssh/authorized_keys`,
  },
] as const;

export const linuxIndependentQuestions = [
  {
    id: 'entry', label: 'Точка входа', options: [
      { id: 'ssh', text: 'Успешный SSH-вход operator с 203.0.113.117.', correct: true },
      { id: 'nginx', text: 'Порт 443 у nginx.' },
      { id: 'timer', text: 'Сам факт наличия systemd timer.' },
    ],
  },
  {
    id: 'account', label: 'Подозрительная учётка', options: [
      { id: 'cache', text: 'system-cache с интерактивным shell и собственным authorized_keys.', correct: true },
      { id: 'www', text: 'www-data с /usr/sbin/nologin.' },
      { id: 'operator', text: 'operator только потому, что это обычный пользователь.' },
    ],
  },
  {
    id: 'persistence', label: 'Механизм закрепления', options: [
      { id: 'timer', text: 'cache-refresh.timer запускает cache-refresh.service каждые пять минут.', correct: true },
      { id: 'logrotate', text: 'Стандартный logrotate.timer.' },
      { id: 'nginx', text: 'Рабочий nginx.' },
    ],
  },
  {
    id: 'network', label: 'Подтверждённое внешнее соединение', options: [
      { id: 'external', text: 'cache-refresh, PID 3914 → 198.51.100.119:9443.', correct: true },
      { id: 'listen', text: 'nginx слушает локальный адрес на 443.' },
      { id: 'none', text: 'Внешних соединений нет.' },
    ],
  },
] as const;

export const linuxFindingSections = [
  {
    id: 'entry', label: 'Как вошли на BET-CORE-02?', options: [
      { id: 'entry-ok', text: 'Через SSH под deploy с неизвестным ключом и внешнего адреса 198.51.100.42.', correct: true },
      { id: 'brute', text: 'Пароль root успешно подобрали перебором.' },
      { id: 'web', text: 'Через SQL-инъекцию в odds-api.' },
    ],
  },
  {
    id: 'actions', label: 'Что сделал вошедший пользователь?', options: [
      { id: 'actions-ok', text: 'Через sudo создал metricsd, установил ключ, unit-файл, cron и перезапустил odds-api после изменения конфига.', correct: true },
      { id: 'read', text: 'Только прочитал системный журнал.' },
      { id: 'wipe', text: 'Удалил всю базу ставок — это полностью доказано.' },
    ],
  },
  {
    id: 'admin', label: 'Что можно сказать о заявлении администратора?', options: [
      { id: 'lie', text: 'Утверждение «ничего не менял» не совпадает с sudo-журналом учётки deploy; кто именно держал ключ, ещё надо установить.', correct: true },
      { id: 'guilty', text: 'Администратор лично украл ставки — это доказано.' },
      { id: 'clean', text: 'Журнал подтверждает, что администратор не входил.' },
    ],
  },
  {
    id: 'impact', label: 'Что известно о пропавших ставках?', options: [
      { id: 'impact-ok', text: 'Очередь изменилась при перезапуске после правки конфига; точный способ и получатель данных пока не доказаны.', correct: true },
      { id: 'sold', text: 'Ставки проданы конкурентам — это подтверждено.' },
      { id: 'none', text: 'Перезапуск никак не связан с очередью.' },
    ],
  },
] as const;

export const linuxReportSections = [
  {
    id: 'summary', label: 'Краткий вывод', options: [
      { id: 'summary-ok', text: 'На BET-CORE-02 подтверждён внешний SSH-доступ под deploy, повышение прав, создание скрытой учётки и два механизма закрепления.', correct: true },
      { id: 'summary-all', text: 'Вся букмекерская сеть полностью уничтожена.' },
      { id: 'summary-safe', text: 'События являются обычным обновлением мониторинга.' },
    ],
  },
  {
    id: 'evidence', label: 'Ключевые доказательства', options: [
      { id: 'evidence-ok', text: 'auth.log и sudo, пользователь metricsd, authorized_keys, odds-sync.service, cron, внешний socket и изменённые файлы.', correct: true },
      { id: 'evidence-admin', text: 'Слова владельца сервера и имя администратора.' },
      { id: 'evidence-port', text: 'Открытые порты 22 и 443 без других данных.' },
    ],
  },
  {
    id: 'scope', label: 'Масштаб', options: [
      { id: 'scope-ok', text: 'Подтверждены BET-CORE-02 и независимый EDGE-BET-04 с похожим закреплением; остальные узлы требуют проверки.', correct: true },
      { id: 'scope-one', text: 'Проблема только в одном cron-файле.' },
      { id: 'scope-all', text: 'Все серверы группы точно скомпрометированы.' },
    ],
  },
  {
    id: 'next', label: 'Следующие действия', options: [
      { id: 'next-ok', text: 'Отозвать ключи, закрыть скрытые аккаунты и службы, восстановить конфиг и очередь, проверить соседние узлы и сменить секреты.', correct: true },
      { id: 'next-logs', text: 'Удалить журналы, чтобы владелец не увидел инцидент.' },
      { id: 'next-reboot', text: 'Перезагрузить сервер и больше ничего не делать.' },
    ],
  },
] as const;
