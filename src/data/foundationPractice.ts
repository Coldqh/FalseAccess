import type { SimulationSkillId, SkillTrackState } from '../simulation/types';

export type FoundationModuleId = 'foundation-0' | 'foundation-1' | 'foundation-2' | 'foundation-3';

export interface FoundationQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string; correct?: boolean }>;
  explanation: string;
}

export interface FoundationTask {
  id: string;
  title: string;
  theory: string;
  command: string;
  accept: string[];
  output: string;
}

export interface FoundationModule {
  id: FoundationModuleId;
  stage: 0 | 1 | 2 | 3;
  title: string;
  subtitle: string;
  scope: string[];
  questions: FoundationQuestion[];
  tasks: FoundationTask[];
  finalPrompt: string;
  finalChecks: string[];
  finalExample: string;
  skillFloors: Partial<Record<SimulationSkillId, Partial<SkillTrackState>>>;
}

export const foundationModules: FoundationModule[] = [
  {
    id: 'foundation-0', stage: 0, title: 'Абсолютный ноль', subtitle: 'Компьютер, файлы, процессы и безопасная работа',
    scope: ['CPU, RAM, storage и периферия', 'ОС, kernel, process и service', 'файл, каталог, путь и расширение', 'права и учётные записи', 'терминал, аргументы и exit code', 'логи, время и источник', 'hash, backup, MFA и обновления', 'Git: status, diff, commit'],
    questions: [
      { id: 'ram', prompt: 'Что обычно исчезает после выключения компьютера?', options: [{id:'disk',text:'Данные на SSD'}, {id:'ram',text:'Содержимое оперативной памяти',correct:true}, {id:'hash',text:'Хэш файла'}], explanation: 'RAM хранит рабочее состояние процессов. Диск хранит постоянные данные.' },
      { id: 'process', prompt: 'Чем процесс отличается от файла программы?', options: [{id:'run',text:'Процесс — запущенный экземпляр программы',correct:true}, {id:'same',text:'Ничем'}, {id:'folder',text:'Процесс — папка'}], explanation: 'Один файл программы может породить несколько процессов с разными PID.' },
      { id: 'hash', prompt: 'Что доказывает совпадение SHA-256?', options: [{id:'safe',text:'Файл безопасен'}, {id:'same',text:'Проверенные байты совпадают',correct:true}, {id:'author',text:'Известен автор'}], explanation: 'Хэш проверяет целостность, но не репутацию и не назначение файла.' },
    ],
    tasks: [
      { id:'cwd', title:'Определи текущий каталог', theory:'Перед работой всегда пойми контекст. pwd печатает абсолютный путь.', command:'pwd', accept:['pwd'], output:'/home/player/lab/foundation-0' },
      { id:'files', title:'Покажи скрытые файлы и права', theory:'ls -la показывает тип, права, владельца, размер и скрытые записи.', command:'ls -la', accept:['ls','-la'], output:'drwxr-x--- player analysts evidence\n-rw-r----- player analysts system.log\n-rw------- player player .env' },
      { id:'processes', title:'Посмотри процессы', theory:'PID связывает процесс с журналами, сетью и родителем.', command:'ps aux', accept:['ps','aux'], output:'USER PID %CPU COMMAND\nplayer 221 0.2 python monitor.py\nroot 1 0.0 /sbin/init' },
      { id:'integrity', title:'Зафиксируй целостность', theory:'Считай хэш до анализа и сохрани его отдельно.', command:'sha256sum evidence/system.log', accept:['sha256sum','system.log'], output:'8f2f6c34d77b...  evidence/system.log' },
      { id:'git', title:'Проверь изменения проекта', theory:'git status не меняет файлы и показывает состояние рабочего дерева.', command:'git status --short', accept:['git','status'], output:' M src/report.md\n?? notes/findings.txt' },
    ],
    finalPrompt: 'Коротко опиши безопасный порядок работы с неизвестным файлом: от получения до первого анализа.',
    finalChecks: ['hash', 'copy', 'isolate', 'log'],
    finalExample: 'Сохранить копию, посчитать hash, работать в изолированной среде, записывать действия и не запускать файл без необходимости.',
    skillFloors: { computer:{theory:35,guided:30,independent:20}, linux:{theory:18,guided:18}, bash:{theory:12,guided:12}, communication:{theory:10,guided:10} },
  },
  {
    id: 'foundation-1', stage: 1, title: 'IT-фундамент', subtitle: 'Windows, Linux, службы и сеть',
    scope: ['Windows и Linux filesystem', 'users, groups, sudo и UAC', 'permissions и ownership', 'process, service и startup', 'IP, mask, gateway и route', 'DNS, DHCP, NAT', 'TCP/UDP и ports', 'HTTP, HTTPS и TLS', 'архивы, package managers и updates', 'базовый troubleshooting'],
    questions: [
      { id:'dns', prompt:'Что возвращает DNS?', options:[{id:'ip',text:'Соответствие имени и записи, часто IP-адрес',correct:true},{id:'password',text:'Пароль пользователя'},{id:'port',text:'Список процессов'}], explanation:'DNS хранит разные типы записей. A/AAAA связывают имя с адресом.' },
      { id:'port', prompt:'Открытый порт означает...', options:[{id:'owned',text:'Узел уже взломан'},{id:'listen',text:'На адресе доступна или слушает служба',correct:true},{id:'safe',text:'Служба безопасна'}], explanation:'Порт — только точка сервиса. Риск зависит от экспозиции, версии и конфигурации.' },
      { id:'tls', prompt:'Что TLS защищает в первую очередь?', options:[{id:'channel',text:'Канал связи и проверку узла при корректной настройке',correct:true},{id:'code',text:'Весь код приложения'},{id:'database',text:'Все данные на диске'}], explanation:'TLS не исправляет уязвимости приложения и не заменяет авторизацию.' },
    ],
    tasks: [
      { id:'identity', title:'Проверь пользователя и группы', theory:'Права зависят от identity и членства в группах.', command:'id && groups', accept:['id','groups'], output:'uid=1000(player) gid=1000(player) groups=player,analysts' },
      { id:'services', title:'Найди слушающие службы', theory:'ss показывает локальные endpoints и процессы.', command:'ss -tulpn', accept:['ss','-tulpn'], output:'tcp LISTEN 0 128 0.0.0.0:22 users:(("sshd",pid=712))\ntcp LISTEN 0 128 127.0.0.1:5432 users:(("postgres",pid=841))' },
      { id:'address', title:'Проверь адрес и маршрут', theory:'IP без mask и route даёт неполную картину.', command:'ip addr && ip route', accept:['ip','addr','route'], output:'10.20.30.14/24 dev eth0\ndefault via 10.20.30.1 dev eth0' },
      { id:'dns-query', title:'Проверь DNS отдельно', theory:'Не смешивай проблему DNS с недоступностью сервиса.', command:'nslookup portal.lab', accept:['nslookup','portal.lab'], output:'Name: portal.lab\nAddress: 10.20.30.40' },
      { id:'http-head', title:'Проверь HTTP-ответ', theory:'HEAD позволяет увидеть статус и заголовки без загрузки тела.', command:'curl -I https://portal.lab', accept:['curl','-i','portal.lab'], output:'HTTP/2 200\nserver: nginx\ncontent-type: text/html\nstrict-transport-security: max-age=31536000' },
    ],
    finalPrompt: 'Опиши путь запроса от браузера до web-сервера: DNS, маршрут, TCP, TLS и HTTP.',
    finalChecks: ['dns', 'tcp', 'tls', 'http'],
    finalExample: 'DNS возвращает адрес, ОС выбирает route, TCP создаёт соединение, TLS проверяет сертификат и шифрует канал, затем HTTP передаёт запрос.',
    skillFloors: { computer:{theory:55,guided:50,independent:30}, windows:{theory:30,guided:28,independent:16}, linux:{theory:32,guided:30,independent:18}, bash:{theory:24,guided:24,independent:14}, networking:{theory:38,guided:34,independent:20}, cryptography:{theory:15,guided:10} },
  },
  {
    id: 'foundation-2', stage: 2, title: 'Junior SOC', subtitle: 'Telemetry, triage и доказательства',
    scope: ['SIEM, EDR, NDR и identity telemetry', 'alert, event, incident и case', 'IOC, IOA и TTP', 'severity, impact и confidence', 'triage и scope', 'Windows Event IDs и Linux auth', 'process tree и network context', 'evidence preservation', 'containment без уничтожения следов', 'эскалация и отчёт'],
    questions: [
      { id:'alert', prompt:'Алерт — это...', options:[{id:'proof',text:'Готовое доказательство взлома'},{id:'signal',text:'Сигнал, который нужно проверить в контексте',correct:true},{id:'malware',text:'Всегда вредоносный файл'}], explanation:'Правило может ошибаться. Аналитик проверяет данные, baseline и затронутые активы.' },
      { id:'ioc', prompt:'Почему одного IP недостаточно для вывода?', options:[{id:'shared',text:'IP может быть shared, proxy, VPN или скомпрометированным узлом',correct:true},{id:'always',text:'IP всегда уникален человеку'},{id:'none',text:'IP не используется в расследованиях'}], explanation:'IOC полезен только с временем, контекстом, identity и поведением.' },
      { id:'contain', prompt:'Что делать перед удалением подозрительного файла?', options:[{id:'delete',text:'Сразу удалить'},{id:'preserve',text:'Сохранить нужные доказательства и оценить влияние локализации',correct:true},{id:'publish',text:'Опубликовать файл'}], explanation:'Необдуманное удаление может уничтожить следы и не закрыть доступ.' },
    ],
    tasks: [
      { id:'failed-logons', title:'Найди серию отказов', theory:'Сначала считай событие, затем связывай с успешным входом.', command:"SigninLogs | where ResultType != 0 | summarize failures=count() by UserPrincipalName, IPAddress", accept:['signinlogs','resulttype','summarize'], output:'svc-backup | 198.51.100.73 | 41\nanna@lab | 203.0.113.10 | 2' },
      { id:'process-tree', title:'Проверь создание процесса', theory:'Событие 4688 полезно только при включённом аудите; command line требует отдельной политики.', command:"Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688}", accept:['get-winevent','4688'], output:'WINWORD.EXE -> powershell.exe -enc ... -> rundll32.exe' },
      { id:'connections', title:'Свяжи процесс с сетью', theory:'Сетевое соединение без process context часто вводит в заблуждение.', command:'Get-NetTCPConnection -State Established', accept:['get-nettcpconnection','established'], output:'LocalAddress 10.20.30.21 LocalPort 51844 RemoteAddress 203.0.113.77 RemotePort 443 OwningProcess 4812' },
      { id:'linux-auth', title:'Проверь успешный SSH-вход', theory:'Failed и Accepted — разные факты. Сопоставляй время, user и source.', command:"grep -E 'Failed|Accepted' /var/log/auth.log", accept:['grep','failed','accepted','auth.log'], output:'02:11 Failed password for root from 198.51.100.73\n02:14 Accepted publickey for deploy from 10.20.30.9' },
      { id:'evidence-hash', title:'Зафиксируй вложение', theory:'Хэш нужен для chain of custody и повторяемости.', command:'sha256sum evidence/invoice.docm', accept:['sha256sum','invoice.docm'], output:'4cf8b23e91d1... evidence/invoice.docm' },
    ],
    finalPrompt: 'Составь triage-вывод: что подтверждено, что является гипотезой, что проверить дальше и как локализовать узел.',
    finalChecks: ['fact', 'hypothesis', 'scope', 'contain'],
    finalExample: 'Fact: Word породил PowerShell и процесс установил TLS-соединение. Hypothesis: документ был initial access. Scope: проверить тот же hash, user и destination на других узлах. Contain: изолировать endpoint после сбора volatile evidence и отозвать активные sessions.',
    skillFloors: { soc:{theory:45,guided:42,independent:28,production:12}, siem:{theory:32,guided:30,independent:18}, windows:{theory:42,guided:38,independent:24}, networking:{theory:45,guided:40,independent:25}, incidentResponse:{theory:28,guided:26,independent:16}, communication:{theory:28,guided:30,independent:20,production:10} },
  },
  {
    id: 'foundation-3', stage: 3, title: 'Автоматизация и Web', subtitle: 'Код, данные, HTTP, API и SQL',
    scope: ['Python syntax и data types', 'functions, errors и modules', 'JSON, CSV и timestamps', 'regex и parsing', 'Bash pipelines', 'PowerShell objects', 'Git workflow и tests', 'HTTP methods, headers и status', 'cookies, sessions и tokens', 'authentication и authorization', 'SQL и parameterized queries', 'API, input validation и logging'],
    questions: [
      { id:'authz', prompt:'Авторизация отвечает на вопрос...', options:[{id:'who',text:'Кто пользователь?'},{id:'allowed',text:'Что этому пользователю разрешено?',correct:true},{id:'dns',text:'Какой IP у сервера?'}], explanation:'Authentication устанавливает identity. Authorization проверяет право на объект и действие.' },
      { id:'sql', prompt:'Зачем параметризовать SQL?', options:[{id:'fast',text:'Только ради скорости'},{id:'separate',text:'Отделить данные от структуры запроса',correct:true},{id:'encrypt',text:'Зашифровать базу'}], explanation:'Параметры не дают пользовательскому вводу стать частью SQL-синтаксиса.' },
      { id:'errors', prompt:'Что должен делать надёжный parser при битой строке?', options:[{id:'crash',text:'Молча завершиться'},{id:'handle',text:'Обработать ошибку, записать контекст и продолжить или остановиться осознанно',correct:true},{id:'guess',text:'Додумать значение'}], explanation:'Ошибки данных — часть реальной работы. Их нельзя скрывать.' },
    ],
    tasks: [
      { id:'json', title:'Извлеки пользователей из JSONL', theory:'jq полезен для быстрой проверки структуры до написания программы.', command:"jq -r '.user' auth.jsonl | sort | uniq -c", accept:['jq','user','sort','uniq'], output:'  2 analyst\n 17 svc-sync\n  1 unknown' },
      { id:'python', title:'Запусти parser', theory:'Скрипт должен принимать вход, валидировать строки и давать воспроизводимый результат.', command:'python analyze.py auth.jsonl --sort time', accept:['python','analyze.py','auth.jsonl'], output:'loaded=20 invalid=1\nfirst=02:11:04 last=02:31:18\nsuspicious_user=svc-sync' },
      { id:'api', title:'Проверь API с сессией', theory:'Клиентский интерфейс не заменяет серверную проверку доступа.', command:"curl -s -H 'Cookie: sid=lab_41' https://api.lab/v1/me | jq", accept:['curl','cookie','api.lab','jq'], output:'{"id":41,"role":"analyst","scopes":["reports:read"]}' },
      { id:'sql', title:'Проверь строки владельца', theory:'WHERE должен ограничивать объект текущим user/tenant.', command:"psql -c \"SELECT id,status FROM reports WHERE owner_id = 41 ORDER BY id;\"", accept:['select','from reports','owner_id','order by'], output:'901 | ready\n904 | processing' },
      { id:'tests', title:'Запусти тесты перед фиксом', theory:'Тест показывает базовое поведение и защищает от регрессии.', command:'npm test -- --run', accept:['npm','test'], output:'PASS authz.test.ts\nPASS parser.test.ts\nTests: 18 passed' },
    ],
    finalPrompt: 'Напиши фрагмент Python, который читает JSONL, пропускает битые строки, фильтрует status=success и сортирует события по time.',
    finalChecks: ['json.loads', 'try', 'except', 'sorted'],
    finalExample: "events=[]\nfor line in file:\n    try: event=json.loads(line)\n    except json.JSONDecodeError: continue\n    if event.get('status')=='success': events.append(event)\nfor event in sorted(events,key=lambda item:item['time']): print(event)",
    skillFloors: { python:{theory:60,guided:55,independent:38,production:15}, bash:{theory:42,guided:40,independent:25}, powershell:{theory:35,guided:32,independent:20}, web:{theory:55,guided:50,independent:34,production:12}, sql:{theory:42,guided:38,independent:25}, appsec:{theory:30,guided:28,independent:18}, soc:{independent:32,production:18}, networking:{theory:52,guided:45,independent:30} },
  },
];
