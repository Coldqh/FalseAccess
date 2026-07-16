export const windowsProcessTree = [
  { pid: 1640, parentPid: 812, name: 'explorer.exe', user: 'NORTHLINE\\elena.orlova', path: 'C:\\Windows\\explorer.exe', depth: 0, trusted: true },
  { pid: 3420, parentPid: 1640, name: 'OUTLOOK.EXE', user: 'NORTHLINE\\elena.orlova', path: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE', depth: 1, trusted: true },
  { pid: 4884, parentPid: 3420, name: 'WINWORD.EXE', user: 'NORTHLINE\\elena.orlova', path: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', depth: 2, trusted: true },
  { pid: 5312, parentPid: 4884, name: 'powershell.exe', user: 'NORTHLINE\\elena.orlova', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', depth: 3, trusted: false },
  { pid: 5488, parentPid: 5312, name: 'invoice_viewer.exe', user: 'NORTHLINE\\elena.orlova', path: 'C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe', depth: 4, trusted: false },
] as const;

export const windowsEventLog = `2029-04-11 19:42:08 EventID=4688 NewProcessId=0x1314 NewProcessName=C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE ParentProcessName=C:\\Program Files\\Microsoft Office\\root\\Office16\\OUTLOOK.EXE SubjectUserName=elena.orlova CommandLine="WINWORD.EXE C:\\Users\\elena.orlova\\Downloads\\payment_schedule.docm"
2029-04-11 19:42:16 EventID=4688 NewProcessId=0x14c0 NewProcessName=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe ParentProcessName=C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE SubjectUserName=elena.orlova CommandLine="powershell.exe -NoProfile -File C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_check.ps1"
2029-04-11 19:42:19 EventID=4688 NewProcessId=0x1570 NewProcessName=C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe ParentProcessName=C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe SubjectUserName=elena.orlova CommandLine="invoice_viewer.exe --background"
2029-04-11 19:45:31 EventID=4688 NewProcessId=0x16b8 NewProcessName=C:\\Windows\\System32\\cmd.exe ParentProcessName=C:\\Windows\\explorer.exe SubjectUserName=elena.orlova CommandLine="cmd.exe /c whoami"`;

export const windowsNetworkOutput = `LocalAddress LocalPort RemoteAddress  RemotePort State       OwningProcess
------------ --------- -------------  ---------- -----       -------------
10.32.4.27   52314     10.32.0.15     443        Established 3420
10.32.4.27   52491     203.0.113.77   443        Established 5488
10.32.4.27   52503     10.32.0.8      445        Established 1640`;

export const windowsHashOutput = `Algorithm : SHA256
Hash      : 9F67B48D29BC4EC602C13D8BAA9D01A76434C8D509DE7C603594D713C928F1A4
Path      : C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe`;

export const windowsStartupOutput = `Name              Command                                                                  Location
----              -------                                                                  --------
OneDrive          "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe" /background        HKCU\\...\\Run
SecurityHealth    %windir%\\system32\\SecurityHealthSystray.exe                               HKLM\\...\\Run
InvoiceUpdater    C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe --boot  HKCU\\...\\Run`;

export const windowsPowerShellObjectives = [
  {
    id: 'processes',
    title: 'Сними список процессов',
    explanation: 'Процесс имеет PID, родительский PID и командную строку. Связь ParentProcessId показывает, какая программа запустила следующую.',
    command: 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine',
    output: `ProcessId ParentProcessId Name               CommandLine
---------  --------------- ----               -----------
1640       812             explorer.exe       C:\\Windows\\explorer.exe
3420       1640            OUTLOOK.EXE         OUTLOOK.EXE
4884       3420            WINWORD.EXE         WINWORD.EXE payment_schedule.docm
5312       4884            powershell.exe      powershell.exe -NoProfile -File ...\\invoice_check.ps1
5488       5312            invoice_viewer.exe  invoice_viewer.exe --background`,
  },
  {
    id: 'events',
    title: 'Найди события создания процессов',
    explanation: 'Event ID 4688 создаётся при запуске процесса, если аудит включён. В нём важны имя нового процесса, родитель и полная командная строка.',
    command: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} -MaxEvents 20",
    output: windowsEventLog,
  },
  {
    id: 'network',
    title: 'Свяжи соединение с PID',
    explanation: 'OwningProcess — PID процесса, которому принадлежит соединение. Сначала фиксируем адрес и PID, потом принимаем решение об изоляции.',
    command: 'Get-NetTCPConnection -State Established | Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,OwningProcess',
    output: windowsNetworkOutput,
  },
  {
    id: 'hash',
    title: 'Посчитай хэш файла',
    explanation: 'SHA-256 — устойчивый идентификатор содержимого файла. Хэш не доказывает вредоносность, но позволяет точно обозначить образец.',
    command: "Get-FileHash 'C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe' -Algorithm SHA256",
    output: windowsHashOutput,
  },
  {
    id: 'startup',
    title: 'Проверь автозапуск',
    explanation: 'Автозапуск отвечает на вопрос, сможет ли процесс вернуться после перезагрузки или нового входа пользователя.',
    command: 'Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location',
    output: windowsStartupOutput,
  },
] as const;

export const windowsProcessQuestions = [
  {
    id: 'chain', label: 'Какая цепочка требует расследования?', options: [
      { id: 'office', text: 'explorer.exe → OUTLOOK.EXE' },
      { id: 'document', text: 'OUTLOOK.EXE → WINWORD.EXE → powershell.exe → invoice_viewer.exe', correct: true },
      { id: 'shell', text: 'explorer.exe → cmd.exe → whoami' },
    ],
  },
  {
    id: 'parent', label: 'Какой процесс запустил PowerShell?', options: [
      { id: 'word', text: 'WINWORD.EXE, PID 4884', correct: true },
      { id: 'outlook', text: 'OUTLOOK.EXE, PID 3420' },
      { id: 'explorer', text: 'explorer.exe, PID 1640' },
    ],
  },
  {
    id: 'pid', label: 'Зачем нужен PID 5488?', options: [
      { id: 'network', text: 'Чтобы связать invoice_viewer.exe с сетевым соединением на 203.0.113.77:443.', correct: true },
      { id: 'malware', text: 'Потому что любой PID выше 5000 означает вредоносный процесс.' },
      { id: 'admin', text: 'Чтобы доказать, что процесс запущен администратором.' },
    ],
  },
] as const;

export const windowsScriptStarter = `# Сборщик артефактов для FIN-WS-07.
# Скрипт только читает состояние и формирует JSON.

# [1] ПРОЦЕССЫ

# [2] СОБЫТИЯ 4688

# [3] СОЕДИНЕНИЯ

# [4] ХЭШ

# [5] АВТОЗАПУСК

# [6] ОТЧЁТ

`;

export const windowsScriptSteps = [
  {
    id: 'processes', marker: '# [1] ПРОЦЕССЫ', title: 'Сохрани процессы',
    text: 'Get-CimInstance возвращает объекты процессов. Select-Object оставляет только поля, нужные для расследования.',
    snippet: '$processes = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine',
    check: /\$processes\s*=\s*Get-CimInstance\s+Win32_Process[\s\S]*Select-Object[\s\S]*ProcessId/i,
  },
  {
    id: 'events', marker: '# [2] СОБЫТИЯ 4688', title: 'Собери события 4688',
    text: 'FilterHashtable фильтрует журнал до чтения. Это быстрее и точнее, чем загружать весь Security log.',
    snippet: "$events = Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} -MaxEvents 50",
    check: /\$events\s*=\s*Get-WinEvent[\s\S]*LogName\s*=\s*['"]Security['"][\s\S]*Id\s*=\s*4688/i,
  },
  {
    id: 'network', marker: '# [3] СОЕДИНЕНИЯ', title: 'Собери активные соединения',
    text: 'OwningProcess связывает сетевое соединение с PID из списка процессов.',
    snippet: '$connections = Get-NetTCPConnection -State Established | Select-Object LocalAddress, RemoteAddress, RemotePort, OwningProcess',
    check: /\$connections\s*=\s*Get-NetTCPConnection[\s\S]*OwningProcess/i,
  },
  {
    id: 'hash', marker: '# [4] ХЭШ', title: 'Зафиксируй SHA-256',
    text: 'Get-FileHash читает файл и возвращает его криптографический отпечаток. Исходный файл не меняется.',
    snippet: "$hash = Get-FileHash 'C:\\Users\\elena.orlova\\AppData\\Local\\Temp\\invoice_viewer.exe' -Algorithm SHA256",
    check: /\$hash\s*=\s*Get-FileHash[\s\S]*invoice_viewer\.exe[\s\S]*SHA256/i,
  },
  {
    id: 'startup', marker: '# [5] АВТОЗАПУСК', title: 'Сними элементы автозапуска',
    text: 'Win32_StartupCommand показывает команды, запускаемые при старте системы или входе пользователя.',
    snippet: '$startup = Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location',
    check: /\$startup\s*=\s*Get-CimInstance\s+Win32_StartupCommand/i,
  },
  {
    id: 'report', marker: '# [6] ОТЧЁТ', title: 'Собери объект и JSON',
    text: 'PSCustomObject создаёт структурированный результат. ConvertTo-Json позволяет передать его дальше без ручного копирования строк.',
    snippet: `[PSCustomObject]@{
    Host = 'FIN-WS-07'
    SuspiciousPid = 5488
    EventCount = $events.Count
    RemoteAddress = '203.0.113.77'
    FileHash = $hash.Hash
    Startup = $startup
} | ConvertTo-Json -Depth 4`,
    check: /\[PSCustomObject\]@\{[\s\S]*SuspiciousPid\s*=\s*5488[\s\S]*ConvertTo-Json\s+-Depth\s+4/i,
  },
] as const;

export const windowsCollectorOutput = `{
  "Host": "FIN-WS-07",
  "SuspiciousPid": 5488,
  "EventCount": 4,
  "RemoteAddress": "203.0.113.77",
  "FileHash": "9F67B48D29BC4EC602C13D8BAA9D01A76434C8D509DE7C603594D713C928F1A4",
  "Startup": [
    { "Name": "OneDrive", "Location": "HKCU\\...\\Run" },
    { "Name": "SecurityHealth", "Location": "HKLM\\...\\Run" },
    { "Name": "InvoiceUpdater", "Location": "HKCU\\...\\Run" }
  ]
}`;

export const independentMachineCommands = [
  {
    id: 'processes', command: 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine',
    output: `ProcessId ParentProcessId Name          CommandLine
---------  --------------- ----          -----------
2216       1452            OUTLOOK.EXE   OUTLOOK.EXE
3092       2216            wscript.exe   wscript.exe C:\\Users\\roman\\AppData\\Local\\Temp\\update_check.vbs
3476       3092            powershell.exe powershell.exe -NoProfile -File C:\\Users\\roman\\AppData\\Local\\Temp\\sync_check.ps1
3812       3476            sync_host.exe sync_host.exe --service`,
  },
  {
    id: 'events', command: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688} -MaxEvents 20",
    output: `20:11:02 4688 OUTLOOK.EXE parent=explorer.exe
20:11:26 4688 wscript.exe parent=OUTLOOK.EXE command=update_check.vbs
20:11:28 4688 powershell.exe parent=wscript.exe command=sync_check.ps1
20:11:31 4688 sync_host.exe parent=powershell.exe command=--service`,
  },
  {
    id: 'network', command: 'Get-NetTCPConnection -State Established | Select-Object RemoteAddress,RemotePort,OwningProcess',
    output: `RemoteAddress  RemotePort OwningProcess
-------------  ---------- -------------
198.51.100.88 443        3812
10.32.0.15    443        2216`,
  },
  {
    id: 'startup', command: 'Get-ScheduledTask | Where-Object {$_.TaskName -like "*Office*"} | Select-Object TaskName,State,TaskPath',
    output: `TaskName             State TaskPath
--------             ----- --------
OfficeTelemetryCheck Ready \\UserTasks\\`,
  },
] as const;

export const windowsIndependentQuestions = [
  {
    id: 'chain', label: 'Подозрительная цепочка', options: [
      { id: 'chain-a', text: 'OUTLOOK.EXE → wscript.exe → powershell.exe → sync_host.exe', correct: true },
      { id: 'chain-b', text: 'explorer.exe → OUTLOOK.EXE' },
      { id: 'chain-c', text: 'services.exe → svchost.exe' },
    ],
  },
  {
    id: 'remote', label: 'Внешний адрес процесса', options: [
      { id: 'external', text: '198.51.100.88:443', correct: true },
      { id: 'internal', text: '10.32.0.15:443' },
      { id: 'none', text: 'Сетевых соединений нет' },
    ],
  },
  {
    id: 'persistence', label: 'Что требует отдельной проверки на закрепление?', options: [
      { id: 'task', text: 'Задача OfficeTelemetryCheck в планировщике.', correct: true },
      { id: 'outlook', text: 'Сам факт запуска Outlook.' },
      { id: 'port', text: 'Любое соединение на порт 443.' },
    ],
  },
  {
    id: 'response', label: 'Первое безопасное действие', options: [
      { id: 'isolate', text: 'Изолировать узел от сети, сохранить текущие данные и продолжить сбор артефактов.', correct: true },
      { id: 'delete', text: 'Сразу удалить sync_host.exe и перезагрузить компьютер.' },
      { id: 'ignore', text: 'Оставить машину в сети, пока пользователь продолжает работать.' },
    ],
  },
] as const;

export const windowsFindingSections = [
  {
    id: 'trigger', label: 'Что запустило цепочку на FIN-WS-07?', options: [
      { id: 'document', text: 'Документ payment_schedule.docm, открытый из Outlook.', correct: true },
      { id: 'update', text: 'Обычное обновление Windows.' },
      { id: 'admin', text: 'Ручной запуск системным администратором.' },
    ],
  },
  {
    id: 'behavior', label: 'Какое поведение подтверждено?', options: [
      { id: 'behavior-ok', text: 'Word запустил PowerShell; тот запустил файл из Temp, который установил внешнее соединение и добавлен в автозапуск.', correct: true },
      { id: 'data-stolen', text: 'Подтверждена кража всей бухгалтерской базы.' },
      { id: 'passwords', text: 'Подтверждена выгрузка паролей домена.' },
    ],
  },
  {
    id: 'unknown', label: 'Чего данные пока не доказывают?', options: [
      { id: 'impact', text: 'Какие именно данные мог получить внешний адрес.', correct: true },
      { id: 'remote', text: 'Адрес внешнего соединения.' },
      { id: 'hash', text: 'SHA-256 исследуемого файла.' },
    ],
  },
  {
    id: 'containment', label: 'Что делать с узлом?', options: [
      { id: 'contain', text: 'Изолировать от сети, сохранить артефакты, отозвать сессии пользователя и проверить соседние машины.', correct: true },
      { id: 'wipe', text: 'Немедленно форматировать диск без сохранения данных.' },
      { id: 'shutdown-all', text: 'Выключить всю инфраструктуру организации.' },
    ],
  },
] as const;

export const windowsReportSections = [
  {
    id: 'summary', label: 'Краткий вывод', options: [
      { id: 'summary-ok', text: 'На FIN-WS-07 подтверждена подозрительная цепочка запуска из документа с последующим внешним соединением и автозапуском.', correct: true },
      { id: 'summary-bad', text: 'Вся сеть полностью захвачена.' },
      { id: 'summary-none', text: 'Это обычная работа Microsoft Office.' },
    ],
  },
  {
    id: 'evidence', label: 'Ключевые доказательства', options: [
      { id: 'evidence-ok', text: 'Event 4688, дерево родительских процессов, PID 5488, соединение с 203.0.113.77:443, SHA-256 и InvoiceUpdater.', correct: true },
      { id: 'evidence-guess', text: 'Сотрудница призналась, что установила вредоносную программу.' },
      { id: 'evidence-port', text: 'Одно соединение на 443 без привязки к процессу.' },
    ],
  },
  {
    id: 'scope', label: 'Масштаб', options: [
      { id: 'scope-ok', text: 'Подтверждены две рабочие станции с похожей цепочкой. Остальную сеть нужно проверить отдельно.', correct: true },
      { id: 'scope-all', text: 'Заражены все устройства домена.' },
      { id: 'scope-one', text: 'Затронута только FIN-WS-07, вторую машину можно игнорировать.' },
    ],
  },
  {
    id: 'next', label: 'Следующие действия', options: [
      { id: 'next-ok', text: 'Сохранить журналы и образцы, изолировать узлы, проверить почтовое вложение, автозапуски и активные сессии.', correct: true },
      { id: 'next-delete', text: 'Удалить файлы и очистить журналы, чтобы инцидент не был виден.' },
      { id: 'next-reboot', text: 'Перезагрузить машины и считать проблему решённой.' },
    ],
  },
] as const;
