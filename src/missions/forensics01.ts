export const forensicsCaseOverview = [
  { label: 'Контур', value: 'DEADFRAME / CASE 08' },
  { label: 'Носители', value: 'E01 / RAM / browser / registry' },
  { label: 'Цель', value: 'восстановить временную линию' },
  { label: 'Режим', value: 'read-only forensic clone' },
] as const;

export const forensicsArchitecture = [
  { id: 'disk', role: 'DISK', title: 'LOCKER-17.E01', subtitle: 'секторный образ SSD', address: 'evidence/disk.E01' },
  { id: 'memory', role: 'MEMORY', title: 'LOCKER-17.raw', subtitle: 'снимок оперативной памяти', address: 'evidence/memory.raw' },
  { id: 'logs', role: 'ARTIFACTS', title: 'Windows / Browser', subtitle: 'prefetch, registry, history', address: 'evidence/artifacts/' },
  { id: 'timeline', role: 'OUTPUT', title: 'super_timeline.csv', subtitle: 'единая хронология', address: 'analysis/timeline.csv' },
] as const;

const option = (id: string, text: string, correct = false) => ({ id, text, correct });

export const forensicsFoundationQuestions = [
  {
    id: 'image', label: 'Зачем работать с образом, а не с оригинальным диском?', options: [
      option('preserve', 'Чтобы не менять исходный носитель и повторить анализ', true),
      option('speed', 'Только ради скорости'),
      option('encrypt', 'Чтобы автоматически расшифровать данные'),
    ],
  },
  {
    id: 'hash', label: 'Зачем считать хэш до и после копирования?', options: [
      option('integrity', 'Подтвердить целостность и неизменность образа', true),
      option('password', 'Получить пароль пользователя'),
      option('compress', 'Сжать файл'),
    ],
  },
  {
    id: 'volatile', label: 'Что есть в памяти, но может исчезнуть после выключения?', options: [
      option('ram', 'Процессы, сетевые соединения, команды и часть ключей/токенов', true),
      option('mft', 'Только MFT'),
      option('bios', 'Только настройки BIOS'),
    ],
  },
  {
    id: 'timeline', label: 'Почему одна временная метка не доказывает действие?', options: [
      option('correlate', 'Её нужно сверять с другими источниками и учитывать тип метки', true),
      option('always', 'Любая метка всегда точна'),
      option('ignore', 'Время в расследовании не используется'),
    ],
  },
] as const;

export const diskObjectives = [
  {
    id: 'hash', title: 'Зафиксируй хэш образа', command: 'sha256sum evidence/LOCKER-17.E01',
    output: '83b417477a94a8496ca7f6ed18e3da7567d89b1d4e80f44b8d543b1b2e92f60c  evidence/LOCKER-17.E01',
  },
  {
    id: 'partitions', title: 'Посмотри таблицу разделов', command: 'mmls evidence/LOCKER-17.E01',
    output: 'DOS Partition Table\n000: Meta 0000000000-0000000000\n001: NTFS 0000002048-0976558079  C:',
  },
  {
    id: 'files', title: 'Построй список файлов без монтирования на запись', command: 'fls -r -m C: evidence/LOCKER-17.E01 > analysis/bodyfile.txt',
    output: 'bodyfile.txt created: 184229 records / read-only source',
  },
  {
    id: 'timeline', title: 'Собери файловую временную линию', command: 'mactime -b analysis/bodyfile.txt -d > analysis/timeline.csv',
    output: 'timeline.csv created: 184229 rows sorted by timestamp',
  },
  {
    id: 'search', title: 'Найди подозрительный файл и соседние события', command: "grep -i 'invoice_viewer.exe\|preview.ps1\|Recent\\\\invoice' analysis/timeline.csv",
    output: '02:14:19,MACB,C:/Users/roman/Downloads/invoice_viewer.exe\n02:14:22,.A.B,C:/Users/roman/AppData/Local/Temp/preview.ps1\n02:14:41,M...,C:/Users/roman/AppData/Roaming/Microsoft/Windows/Recent/invoice.lnk',
  },
] as const;

export const diskQuestions = [
  {
    id: 'source', label: 'Какой файл появился первым?', options: [
      option('viewer', 'invoice_viewer.exe в Downloads', true),
      option('ps1', 'preview.ps1 во временной папке'),
      option('lnk', 'ярлык invoice.lnk'),
    ],
  },
  {
    id: 'proof', label: 'Что подтверждает запуск, а не только наличие файла?', options: [
      option('multi', 'Prefetch/Amcache/процесс в памяти и связанные события', true),
      option('name', 'Одно имя файла'),
      option('download', 'Только папка Downloads'),
    ],
  },
] as const;

export const artifactObjectives = [
  {
    id: 'browser', title: 'Проверь историю загрузок', command: "sqlite3 artifacts/History.db \"select datetime(start_time,'unixepoch'), target_path, tab_url from downloads;\"",
    output: '02:14:17|C:\\Users\\roman\\Downloads\\invoice_viewer.exe|https://files-deadframe.example/invoice/771',
  },
  {
    id: 'prefetch', title: 'Проверь факт исполнения', command: 'cat artifacts/INVOICE_VIEWER.EXE.pf.txt',
    output: 'Executable=INVOICE_VIEWER.EXE\nRunCount=1\nLastRun=2026-07-16 02:14:20\nReferenced=KERNEL32.DLL, POWERSHELL.EXE, preview.ps1',
  },
  {
    id: 'registry', title: 'Проверь пользовательский автозапуск', command: "grep -i 'invoice\|preview' artifacts/NTUSER-runkeys.txt",
    output: 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\PreviewSync = powershell.exe -File C:\\Users\\roman\\AppData\\Local\\Temp\\preview.ps1',
  },
  {
    id: 'deleted', title: 'Найди удалённый журнал', command: "fls -rd evidence/LOCKER-17.E01 | grep 'sync.log'",
    output: 'r/r * 128774-128-4: Users/roman/AppData/Local/Temp/sync.log',
  },
  {
    id: 'recover', title: 'Извлеки удалённый файл в рабочую папку', command: 'icat evidence/LOCKER-17.E01 128774-128-4 > analysis/sync.log',
    output: 'Recovered 742 bytes to analysis/sync.log\n02:15:01 token_loaded sid=dl_49a1\n02:15:07 upload_started dst=198.51.100.67:443\n02:15:39 upload_complete bytes=2847712',
  },
] as const;

export const memoryObjectives = [
  {
    id: 'info', title: 'Определи профиль снимка', command: 'vol -f evidence/LOCKER-17.raw windows.info.Info',
    output: 'Kernel Base 0xf8067c000000\nNTBuildLab 10.0.26100.1\nSystemTime 2026-07-16 02:16:03 UTC+3',
  },
  {
    id: 'ps', title: 'Построй список процессов', command: 'vol -f evidence/LOCKER-17.raw windows.pslist.PsList',
    output: 'PID PPID ImageFileName\n4212 3128 invoice_viewer.exe\n4376 4212 powershell.exe\n4488 4376 syncsvc.exe',
  },
  {
    id: 'cmdline', title: 'Сверь командные строки', command: 'vol -f evidence/LOCKER-17.raw windows.cmdline.CmdLine',
    output: '4212 invoice_viewer.exe --open invoice_771.pdf\n4376 powershell.exe -NoProfile -File C:\\Users\\roman\\AppData\\Local\\Temp\\preview.ps1\n4488 syncsvc.exe --session dl_49a1',
  },
  {
    id: 'netscan', title: 'Найди сетевое соединение', command: 'vol -f evidence/LOCKER-17.raw windows.netscan.NetScan',
    output: 'TCPv4 10.55.4.17:51322 198.51.100.67:443 ESTABLISHED PID 4488 syncsvc.exe',
  },
  {
    id: 'handles', title: 'Свяжи процесс с открытыми файлами', command: "vol -f evidence/LOCKER-17.raw windows.handles.Handles --pid 4488 | grep -Ei 'invoice|sync.log|Chrome'",
    output: 'File C:\\Users\\roman\\Documents\\contracts\\invoice_771.pdf\nFile C:\\Users\\roman\\AppData\\Local\\Temp\\sync.log\nFile C:\\Users\\roman\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Login Data',
  },
] as const;

export const memoryQuestions = [
  {
    id: 'chain', label: 'Какая цепочка подтверждена?', options: [
      option('chain', 'invoice_viewer.exe → PowerShell → syncsvc.exe → 198.51.100.67:443', true),
      option('browser', 'Chrome → explorer.exe → SMB'),
      option('unknown', 'Процессы не связаны'),
    ],
  },
  {
    id: 'scope', label: 'Какие данные мог читать syncsvc.exe?', options: [
      option('handles', 'Документ, sync.log и браузерную Login Data по открытым handles', true),
      option('all', 'Весь диск без доказательств'),
      option('none', 'Никакие'),
    ],
  },
] as const;

export const containmentSections = [
  {
    id: 'preserve', label: 'Сохранность доказательств', options: [
      option('hash', 'Зафиксировать источник, время, хэши и рабочие копии', true),
      option('edit', 'Открыть оригинал и удалить подозрительные файлы'),
      option('rename', 'Переименовать образ'),
    ],
  },
  {
    id: 'host', label: 'Устройство', options: [
      option('isolate', 'Изолировать узел, сохранить volatile-данные и затем восстанавливать', true),
      option('wipe', 'Сразу переустановить без сбора'),
      option('leave', 'Оставить в сети'),
    ],
  },
  {
    id: 'identity', label: 'Сессии и учётные данные', options: [
      option('revoke', 'Отозвать сессии после фиксации артефактов и проверить использование токена', true),
      option('password', 'Только сменить пароль'),
      option('ignore', 'Ничего не делать'),
    ],
  },
] as const;

export const independentCommands = [
  { id: 'hash', command: 'sha256sum evidence/VAULT-03.E01 evidence/VAULT-03.raw', output: '1f04...a91  VAULT-03.E01\n71bc...e02  VAULT-03.raw' },
  { id: 'timeline', command: "grep -Ei 'archive_pack.exe|vault.ps1|Recent\\\\archive' evidence/VAULT-03.timeline.csv", output: '03:41:11 archive_pack.exe created\n03:41:15 vault.ps1 created\n03:42:02 archive.lnk modified' },
  { id: 'browser', command: 'cat evidence/VAULT-03.browser-downloads.txt', output: '03:41:08 target=archive_pack.exe url=https://node-mirror.example/tools/archive' },
  { id: 'ps', command: 'vol -f evidence/VAULT-03.raw windows.pstree.PsTree', output: 'explorer.exe(2212)\n  archive_pack.exe(5104)\n    powershell.exe(5188)\n      vaultsvc.exe(5310)' },
  { id: 'net', command: 'vol -f evidence/VAULT-03.raw windows.netscan.NetScan', output: '10.55.9.3:50091 -> 203.0.113.119:8443 ESTABLISHED PID 5310 vaultsvc.exe' },
] as const;

export const independentQuestions = [
  {
    id: 'entry', label: 'Начальная точка второго инцидента', options: [
      option('download', 'Загрузка archive_pack.exe из браузера', true),
      option('service', 'Само появление vaultsvc.exe без причины'),
      option('network', 'Внешний адрес создал файл'),
    ],
  },
  {
    id: 'process', label: 'Процесс внешнего соединения', options: [
      option('vaultsvc', 'vaultsvc.exe PID 5310', true),
      option('explorer', 'explorer.exe'),
      option('powershell', 'Любой powershell.exe'),
    ],
  },
] as const;

export const findingSections = [
  {
    id: 'initial', label: 'Первоначальное действие', options: [
      option('download', 'Пользователь скачал и запустил invoice_viewer.exe', true),
      option('usb', 'Заражение через USB'),
      option('rdp', 'Успешный RDP-вход'),
    ],
  },
  {
    id: 'execution', label: 'Исполнение', options: [
      option('process', 'invoice_viewer → PowerShell → syncsvc', true),
      option('service-only', 'Только штатная служба'),
      option('none', 'Запуск не подтверждён'),
    ],
  },
  {
    id: 'data', label: 'Доступ к данным', options: [
      option('handles', 'Подтверждены открытые документ, sync.log и браузерная Login Data', true),
      option('database', 'Украдена вся база компании'),
      option('unknown', 'Процесс не открывал файлов'),
    ],
  },
  {
    id: 'network', label: 'Внешний канал', options: [
      option('remote', 'syncsvc.exe установил TLS-соединение с 198.51.100.67:443', true),
      option('dns', 'Только DNS без соединения'),
      option('none', 'Сетевой активности нет'),
    ],
  },
] as const;

export const reportSections = [
  {
    id: 'evidence', label: 'Доказательства', options: [
      option('sources', 'E01 и RAM с хэшами, browser history, Prefetch, registry, timeline и recovered log', true),
      option('screenshot', 'Один скриншот процесса'),
      option('guess', 'Предположение пользователя'),
    ],
  },
  {
    id: 'limits', label: 'Ограничение вывода', options: [
      option('limit', 'Открытые файлы и upload подтверждены, полный состав переданных данных требует серверных журналов', true),
      option('all', 'Точно украдены все данные'),
      option('none', 'Никаких ограничений нет'),
    ],
  },
  {
    id: 'response', label: 'Рекомендация', options: [
      option('response', 'Изоляция, отзыв сессий, поиск индикаторов, восстановление и сохранение evidence chain', true),
      option('delete', 'Удалить один EXE и закрыть дело'),
      option('wipe-all', 'Уничтожить все носители'),
    ],
  },
] as const;
