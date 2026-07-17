import type { SimulationSkillId, SkillTrackState } from '../simulation/types';
import type { LearningEvidenceLevel } from './learningStandards';

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
  allowedStarts: string[];
  commandPatterns: string[];
  rejectPatterns?: string[];
  output: string;
  evidence: string;
}

export interface FoundationRubric {
  minWords: number;
  requiredGroups: Array<{ id: string; label: string; terms: string[] }>;
  forbiddenClaims?: string[];
}

export interface FoundationModule {
  id: FoundationModuleId;
  stage: 0 | 1 | 2 | 3;
  title: string;
  subtitle: string;
  evidenceLevel: LearningEvidenceLevel;
  scope: string[];
  sourceIds: string[];
  evidence: string[];
  limitations: string[];
  questions: FoundationQuestion[];
  tasks: FoundationTask[];
  finalPrompt: string;
  finalChecks: string[];
  finalRubric: FoundationRubric;
  finalExample: string;
  skillFloors: Partial<Record<SimulationSkillId, Partial<SkillTrackState>>>;
}

export const foundationModules: FoundationModule[] = [
  {
    id: 'foundation-0',
    stage: 0,
    title: 'Абсолютный ноль',
    subtitle: 'Компьютер, файлы, процессы и безопасная работа',
    evidenceLevel: 'guided-practice',
    scope: [
      'CPU, RAM, storage и периферия',
      'ОС, kernel, process и service',
      'файл, каталог, путь и расширение',
      'права и учётные записи',
      'терминал, аргументы и exit code',
      'логи, время и источник',
      'hash, backup, MFA и обновления',
      'Git: status, diff и commit',
    ],
    sourceIds: ['cs50-cyber', 'nice', 'stanford-cs155'],
    evidence: [
      'объясняет разницу между постоянными данными и состоянием в памяти',
      'читает путь, права, владельца и PID из подготовленного снимка',
      'вводит пять структурно проверяемых read-only команд',
      'пишет порядок безопасной первичной обработки неизвестного файла',
    ],
    limitations: [
      'команды выполняются на синтетическом снимке, а не в настоящем shell',
      'этап не подтверждает уверенное владение Linux, Git или malware analysis',
      'прохождение не является внешней сертификацией',
    ],
    questions: [
      {
        id: 'ram',
        prompt: 'Что обычно теряется после полного выключения компьютера?',
        options: [
          { id: 'disk', text: 'Файлы на исправном SSD' },
          { id: 'ram', text: 'Текущее содержимое оперативной памяти', correct: true },
          { id: 'hash', text: 'Опубликованный SHA-256' },
        ],
        explanation: 'RAM хранит volatile-состояние. Файлы на диске рассчитаны на постоянное хранение.',
      },
      {
        id: 'process',
        prompt: 'Что точнее всего описывает процесс?',
        options: [
          { id: 'run', text: 'Запущенный экземпляр программы со своим PID и состоянием', correct: true },
          { id: 'same', text: 'Любой файл с расширением .exe' },
          { id: 'folder', text: 'Каталог, где лежат настройки программы' },
        ],
        explanation: 'Один файл программы может породить несколько процессов с разными PID, аргументами и правами.',
      },
      {
        id: 'hash',
        prompt: 'Что доказывает совпадение SHA-256 двух проверенных файлов?',
        options: [
          { id: 'safe', text: 'Оба файла безопасны' },
          { id: 'same', text: 'Их проверенные байты совпадают с крайне высокой вероятностью', correct: true },
          { id: 'author', text: 'Известен автор и источник файла' },
        ],
        explanation: 'Хэш помогает проверять целостность. Он не определяет намерения автора и не заменяет анализ.',
      },
      {
        id: 'exit',
        prompt: 'Зачем смотреть exit code команды?',
        options: [
          { id: 'result', text: 'Чтобы отличать успешное завершение от ошибки и не считать неполный сбор успешным', correct: true },
          { id: 'speed', text: 'Чтобы измерять скорость процессора' },
          { id: 'admin', text: 'Чтобы автоматически получить права администратора' },
        ],
        explanation: 'Вывод может быть пустым или частичным. Exit code помогает понять, завершилась ли операция штатно.',
      },
    ],
    tasks: [
      {
        id: 'cwd',
        title: 'Определи текущий каталог',
        theory: 'Перед любой командой установи контекст. pwd печатает абсолютный путь и ничего не меняет.',
        command: 'pwd',
        accept: ['pwd'],
        allowedStarts: ['pwd'],
        commandPatterns: ['^pwd(?:\\s*)$'],
        output: '/home/player/lab/foundation-0',
        evidence: 'Игрок использовал read-only команду определения текущего каталога.',
      },
      {
        id: 'files',
        title: 'Покажи скрытые файлы и права',
        theory: 'ls -la показывает скрытые записи, тип, права, владельца и размер.',
        command: 'ls -la',
        accept: ['ls', '-la'],
        allowedStarts: ['ls'],
        commandPatterns: ['^ls\\s+(?:-la|-al)(?:\\s+\\.)?\\s*$'],
        rejectPatterns: ['--delete', '--remove'],
        output: 'drwxr-x--- player analysts evidence\n-rw-r----- player analysts system.log\n-rw------- player player .env',
        evidence: 'Игрок запросил подробный список с правами и скрытыми файлами.',
      },
      {
        id: 'processes',
        title: 'Посмотри процессы',
        theory: 'PID связывает процесс с родителем, журналами и сетевыми соединениями.',
        command: 'ps aux',
        accept: ['ps', 'aux'],
        allowedStarts: ['ps'],
        commandPatterns: ['^ps\\s+aux(?:\\s*)$'],
        output: 'USER PID %CPU COMMAND\nplayer 221 0.2 python monitor.py\nroot 1 0.0 /sbin/init',
        evidence: 'Игрок запросил полный снимок процессов и получил PID.',
      },
      {
        id: 'integrity',
        title: 'Зафиксируй целостность',
        theory: 'Считай хэш рабочей копии до анализа и сохрани значение отдельно от файла.',
        command: 'sha256sum evidence/system.log',
        accept: ['sha256sum', 'system.log'],
        allowedStarts: ['sha256sum'],
        commandPatterns: ['^sha256sum\\s+evidence/system\\.log\\s*$'],
        output: '8f2f6c34d77b...  evidence/system.log',
        evidence: 'Игрок идентифицировал конкретную рабочую копию по SHA-256.',
      },
      {
        id: 'git',
        title: 'Проверь изменения проекта',
        theory: 'git status --short не меняет рабочее дерево и быстро показывает изменённые и новые файлы.',
        command: 'git status --short',
        accept: ['git', 'status'],
        allowedStarts: ['git'],
        commandPatterns: ['^git\\s+status(?:\\s+--short|\\s+-s)\\s*$'],
        rejectPatterns: ['reset', 'clean', 'checkout', 'restore'],
        output: ' M src/report.md\n?? notes/findings.txt',
        evidence: 'Игрок проверил состояние рабочего дерева без изменения файлов.',
      },
    ],
    finalPrompt: 'Опиши безопасный порядок работы с неизвестным файлом: от получения до первого анализа. Отдели обязательные действия от того, чего пока нельзя утверждать.',
    finalChecks: ['hash', 'copy', 'isolate', 'log'],
    finalRubric: {
      minWords: 28,
      requiredGroups: [
        { id: 'copy', label: 'рабочая копия', terms: ['копи', 'copy', 'образ'] },
        { id: 'hash', label: 'контроль целостности', terms: ['hash', 'хэш', 'sha-256', 'sha256'] },
        { id: 'isolate', label: 'изоляция', terms: ['изол', 'sandbox', 'песочниц', 'offline'] },
        { id: 'record', label: 'фиксация действий', terms: ['лог', 'журнал', 'запис', 'фиксир'] },
        { id: 'limits', label: 'ограничение вывода', terms: ['не доказы', 'нельзя утверж', 'не означает', 'гипотез'] },
      ],
      forbiddenClaims: ['хэш доказывает безопасность', 'можно сразу запускать', 'точно вирус'],
    },
    finalExample: 'Сохранить исходник и рабочую копию, записать источник и время, посчитать SHA-256, анализировать копию в изолированной среде и вести журнал команд. Совпадение хэша подтверждает байты, но не доказывает безопасность файла.',
    skillFloors: {
      computer: { theory: 28, guided: 24, independent: 10 },
      linux: { theory: 12, guided: 12 },
      bash: { theory: 8, guided: 8 },
      communication: { theory: 8, guided: 8 },
    },
  },
  {
    id: 'foundation-1',
    stage: 1,
    title: 'IT-фундамент',
    subtitle: 'Windows, Linux, службы и сеть',
    evidenceLevel: 'guided-practice',
    scope: [
      'Windows и Linux filesystem',
      'users, groups, sudo и UAC',
      'permissions и ownership',
      'process, service и startup',
      'IP, mask, gateway и route',
      'DNS, DHCP и NAT',
      'TCP/UDP и ports',
      'HTTP, HTTPS и TLS',
      'package managers и updates',
      'базовый troubleshooting',
    ],
    sourceIds: ['cs50-cyber', 'stanford-cs155', 'berkeley-cs161', 'nice'],
    evidence: [
      'разделяет DNS, route, TCP, TLS и HTTP как разные слои проверки',
      'читает локальные адреса, default route и listening sockets',
      'объясняет, почему открытый порт и HTTPS не равны безопасности',
      'пишет связный путь запроса от имени до HTTP-ответа',
    ],
    limitations: [
      'нет реальной настройки Windows, Linux, DHCP, DNS или firewall',
      'нет packet capture и диагностики случайной неисправности',
      'этап подтверждает базовую модель, а не работу системного администратора',
    ],
    questions: [
      {
        id: 'dns',
        prompt: 'Что возвращает DNS-клиенту?',
        options: [
          { id: 'record', text: 'Запись нужного типа, например A/AAAA с адресом', correct: true },
          { id: 'password', text: 'Пароль учётной записи' },
          { id: 'route', text: 'Полную таблицу маршрутов сервера' },
        ],
        explanation: 'DNS хранит разные типы записей. Резолвинг имени и доступность сервиса проверяются отдельно.',
      },
      {
        id: 'port',
        prompt: 'Что можно осторожно заключить по listening-порту?',
        options: [
          { id: 'listen', text: 'Процесс или служба слушает endpoint; риск зависит от экспозиции и конфигурации', correct: true },
          { id: 'owned', text: 'Узел уже скомпрометирован' },
          { id: 'safe', text: 'Сервис безопасен, если порт стандартный' },
        ],
        explanation: 'Порт — точка сервиса. Он не является оценкой безопасности и не доказывает удалённый доступ.',
      },
      {
        id: 'tls',
        prompt: 'Что TLS защищает при корректной проверке сертификата?',
        options: [
          { id: 'channel', text: 'Канал, целостность передачи и аутентификацию узла в пределах модели доверия', correct: true },
          { id: 'code', text: 'Отсутствие уязвимостей в приложении' },
          { id: 'disk', text: 'Все данные на диске сервера' },
        ],
        explanation: 'TLS не заменяет authorization, secure coding и защиту данных на диске.',
      },
      {
        id: 'route',
        prompt: 'Когда используется default route?',
        options: [
          { id: 'default', text: 'Когда для назначения нет более точного маршрута', correct: true },
          { id: 'always', text: 'Для любого пакета, включая локальную подсеть' },
          { id: 'dns', text: 'Только после ошибки DNS' },
        ],
        explanation: 'Таблица выбирает наиболее специфичный подходящий маршрут; default — запасной путь.',
      },
    ],
    tasks: [
      {
        id: 'identity',
        title: 'Проверь пользователя и группы',
        theory: 'Права зависят от текущей identity и членства в группах.',
        command: 'id && groups',
        accept: ['id', 'groups'],
        allowedStarts: ['id'],
        commandPatterns: ['^id\\s*&&\\s*groups\\s*$'],
        output: 'uid=1000(player) gid=1000(player) groups=player,analysts',
        evidence: 'Игрок связал текущего пользователя с группами доступа.',
      },
      {
        id: 'services',
        title: 'Найди слушающие службы',
        theory: 'ss показывает endpoints, состояние и при достаточных правах связанный процесс.',
        command: 'ss -tulpn',
        accept: ['ss', '-tulpn'],
        allowedStarts: ['ss'],
        commandPatterns: ['^ss\\s+-(?:tulpn|lntup|tunlp)\\s*$'],
        output: 'tcp LISTEN 0 128 0.0.0.0:22 users:(("sshd",pid=712))\ntcp LISTEN 0 128 127.0.0.1:5432 users:(("postgres",pid=841))',
        evidence: 'Игрок различил exposed и loopback-only listening endpoints.',
      },
      {
        id: 'address',
        title: 'Проверь адрес и маршрут',
        theory: 'IP без prefix и route даёт неполную картину сетевого контекста.',
        command: 'ip addr && ip route',
        accept: ['ip', 'addr', 'route'],
        allowedStarts: ['ip'],
        commandPatterns: ['^ip\\s+(?:addr|address)\\s*&&\\s*ip\\s+route\\s*$'],
        output: '10.20.30.14/24 dev eth0\ndefault via 10.20.30.1 dev eth0',
        evidence: 'Игрок получил адрес интерфейса, prefix и default gateway.',
      },
      {
        id: 'dns-query',
        title: 'Проверь DNS отдельно',
        theory: 'Отдельный запрос позволяет не смешивать ошибку резолвинга с TCP или приложением.',
        command: 'nslookup portal.lab',
        accept: ['nslookup', 'portal.lab'],
        allowedStarts: ['nslookup', 'dig'],
        commandPatterns: ['^(?:nslookup\\s+portal\\.lab|dig\\s+portal\\.lab(?:\\s+\\+short)?)\\s*$'],
        output: 'Name: portal.lab\nAddress: 10.20.30.40',
        evidence: 'Игрок отдельно проверил соответствие имени адресу.',
      },
      {
        id: 'http-head',
        title: 'Проверь HTTP-ответ',
        theory: 'HEAD или вывод заголовков показывает status и metadata без полного тела.',
        command: 'curl -I https://portal.lab',
        accept: ['curl', '-i', 'portal.lab'],
        allowedStarts: ['curl'],
        commandPatterns: ['^curl\\s+(?:-I|--head)\\s+https://portal\\.lab/?\\s*$'],
        rejectPatterns: ['-k', '--insecure'],
        output: 'HTTP/2 200\nserver: nginx\ncontent-type: text/html\nstrict-transport-security: max-age=31536000',
        evidence: 'Игрок получил HTTP status и заголовки без отключения проверки TLS.',
      },
    ],
    finalPrompt: 'Опиши путь запроса от ввода имени в браузере до HTTP-ответа. Для каждого слоя укажи, что он даёт и чего не доказывает.',
    finalChecks: ['dns', 'route', 'tcp', 'tls', 'http'],
    finalRubric: {
      minWords: 38,
      requiredGroups: [
        { id: 'dns', label: 'DNS', terms: ['dns', 'резолв', 'имя'] },
        { id: 'route', label: 'маршрут', terms: ['route', 'маршрут', 'gateway', 'шлюз'] },
        { id: 'tcp', label: 'TCP', terms: ['tcp', 'соединен', 'handshake'] },
        { id: 'tls', label: 'TLS', terms: ['tls', 'сертификат', 'шифр'] },
        { id: 'http', label: 'HTTP', terms: ['http', 'запрос', 'status', 'ответ'] },
        { id: 'limits', label: 'границы вывода', terms: ['не доказы', 'не означает', 'отдельно', 'не гарант'] },
      ],
      forbiddenClaims: ['https гарантирует безопасность', 'порт 443 безопасен', 'dns шифрует'],
    },
    finalExample: 'DNS возвращает адрес, ОС выбирает наиболее точный route и gateway, TCP создаёт соединение, TLS проверяет цепочку и имя сертификата и защищает канал, затем HTTP передаёт запрос и status. Успешный HTTPS не доказывает корректную авторизацию или отсутствие уязвимостей приложения.',
    skillFloors: {
      computer: { theory: 42, guided: 36, independent: 18 },
      windows: { theory: 20, guided: 16, independent: 8 },
      linux: { theory: 24, guided: 22, independent: 12 },
      bash: { theory: 18, guided: 18, independent: 10 },
      networking: { theory: 30, guided: 28, independent: 14 },
      cryptography: { theory: 12, guided: 8 },
    },
  },
  {
    id: 'foundation-2',
    stage: 2,
    title: 'Junior SOC: фундамент',
    subtitle: 'Telemetry, triage, scope и доказательства',
    evidenceLevel: 'guided-practice',
    scope: [
      'SIEM, EDR, NDR и identity telemetry',
      'alert, event, incident и case',
      'IOC, IOA и TTP',
      'severity, impact и confidence',
      'triage и scope',
      'Windows Event IDs и Linux auth',
      'process tree и network context',
      'evidence preservation',
      'containment и business impact',
      'эскалация и отчёт',
    ],
    sourceIds: ['nist-ir', 'nice', 'sc200'],
    evidence: [
      'отделяет alert от подтверждённого incident',
      'связывает identity, process, network и время',
      'формулирует confirmed facts, hypothesis, scope и containment',
      'указывает telemetry gaps и ограничения уверенности',
    ],
    limitations: [
      'нет настоящего SIEM/XDR и работы с большим объёмом шумных данных',
      'нет смены, SLA, передачи между аналитиками и реального business owner',
      'этап не подтверждает готовность к трудоустройству Junior SOC',
    ],
    questions: [
      {
        id: 'alert',
        prompt: 'Что такое alert в SOC?',
        options: [
          { id: 'signal', text: 'Сигнал правила или продукта, который нужно проверить в контексте', correct: true },
          { id: 'proof', text: 'Готовое доказательство завершённого взлома' },
          { id: 'malware', text: 'Всегда найденный вредоносный файл' },
        ],
        explanation: 'Правило может ошибаться, а событие может быть легитимным. Аналитик подтверждает факты и scope.',
      },
      {
        id: 'ioc',
        prompt: 'Почему одного IP недостаточно для атрибуции?',
        options: [
          { id: 'shared', text: 'Адрес может быть shared, proxy, VPN, CDN или скомпрометированным узлом', correct: true },
          { id: 'person', text: 'IP всегда однозначно идентифицирует человека' },
          { id: 'none', text: 'IP вообще не используется в расследованиях' },
        ],
        explanation: 'IOC требует времени, направления соединения, identity, asset context и поведения.',
      },
      {
        id: 'contain',
        prompt: 'Что оценить перед активным containment?',
        options: [
          { id: 'preserve', text: 'Evidence, scope, критичность актива и влияние действия на бизнес', correct: true },
          { id: 'delete', text: 'Только скорость удаления файла' },
          { id: 'all', text: 'Можно сразу выключить все системы организации' },
        ],
        explanation: 'Containment должен снижать ущерб, сохраняя данные и не создавая лишний простой.',
      },
      {
        id: 'absence',
        prompt: 'Нет события в SIEM. Что это означает?',
        options: [
          { id: 'check', text: 'Нужно проверить coverage, retention, parsing и альтернативные источники', correct: true },
          { id: 'clean', text: 'Активность точно не происходила' },
          { id: 'attack', text: 'SIEM точно был удалён атакующим' },
        ],
        explanation: 'Отсутствие события может быть фактом, но его причина неизвестна без проверки телеметрии.',
      },
    ],
    tasks: [
      {
        id: 'failed-logons',
        title: 'Найди серию отказов',
        theory: 'Сначала агрегируй отказы, затем отдельно ищи успешные входы и downstream-активность.',
        command: 'SigninLogs | where ResultType != 0 | summarize failures=count() by UserPrincipalName, IPAddress',
        accept: ['signinlogs', 'resulttype', 'summarize'],
        allowedStarts: ['signinlogs'],
        commandPatterns: ['^signinlogs\\s*\\|\\s*where\\s+resulttype\\s*!=\\s*0\\s*\\|\\s*summarize\\s+failures\\s*=\\s*count\\(\\)\\s+by\\s+userprincipalname\\s*,\\s*ipaddress\\s*$'],
        output: 'svc-backup | 198.51.100.73 | 41\nanna@lab | 203.0.113.10 | 2',
        evidence: 'Игрок агрегировал failures по identity и source address.',
      },
      {
        id: 'process-tree',
        title: 'Проверь создание процесса',
        theory: 'Event 4688 полезен при включённом Audit Process Creation; command line требует отдельной политики.',
        command: "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688}",
        accept: ['get-winevent', '4688'],
        allowedStarts: ['get-winevent'],
        commandPatterns: ['^get-winevent\\s+-filterhashtable\\s+@\\{[^}]*logname\\s*=\\s*[\"\']security[\"\'][^}]*id\\s*=\\s*4688[^}]*\\}\\s*$'],
        output: 'WINWORD.EXE -> powershell.exe -enc ... -> rundll32.exe',
        evidence: 'Игрок запросил события создания процессов из Security log.',
      },
      {
        id: 'connections',
        title: 'Свяжи процесс с сетью',
        theory: 'Сетевое соединение без OwningProcess и времени часто вводит в заблуждение.',
        command: 'Get-NetTCPConnection -State Established',
        accept: ['get-nettcpconnection', 'established'],
        allowedStarts: ['get-nettcpconnection'],
        commandPatterns: ['^get-nettcpconnection\\s+-state\\s+established\\s*$'],
        output: 'LocalAddress 10.20.30.21 LocalPort 51844 RemoteAddress 203.0.113.77 RemotePort 443 OwningProcess 4812',
        evidence: 'Игрок получил active connection с PID процесса.',
      },
      {
        id: 'linux-auth',
        title: 'Сопоставь Failed и Accepted SSH',
        theory: 'Failed и Accepted — разные факты. Сопоставляй time, account и source.',
        command: "grep -E 'Failed|Accepted' /var/log/auth.log",
        accept: ['grep', 'failed', 'accepted', 'auth.log'],
        allowedStarts: ['grep'],
        commandPatterns: ['^grep\\s+-E\\s+[\"\']failed\\|accepted[\"\']\\s+/var/log/auth\\.log\\s*$'],
        output: '02:11 Failed password for root from 198.51.100.73\n02:14 Accepted publickey for deploy from 10.20.30.9',
        evidence: 'Игрок разделил неуспешную попытку и подтверждённый вход.',
      },
      {
        id: 'evidence-hash',
        title: 'Зафиксируй вложение',
        theory: 'Хэш идентифицирует образец и поддерживает повторяемость анализа.',
        command: 'sha256sum evidence/invoice.docm',
        accept: ['sha256sum', 'invoice.docm'],
        allowedStarts: ['sha256sum'],
        commandPatterns: ['^sha256sum\\s+evidence/invoice\\.docm\\s*$'],
        output: '4cf8b23e91d1... evidence/invoice.docm',
        evidence: 'Игрок зафиксировал SHA-256 конкретного вложения.',
      },
    ],
    finalPrompt: 'Составь triage-вывод. Отдельно напиши confirmed facts, hypothesis, scope, telemetry limitations и containment с учётом бизнеса.',
    finalChecks: ['fact', 'hypothesis', 'scope', 'contain'],
    finalRubric: {
      minWords: 55,
      requiredGroups: [
        { id: 'facts', label: 'подтверждённые факты', terms: ['fact', 'факт', 'подтвержд'] },
        { id: 'hypothesis', label: 'гипотеза', terms: ['hypothesis', 'гипотез', 'предполож'] },
        { id: 'scope', label: 'scope', terms: ['scope', 'масштаб', 'затронут'] },
        { id: 'limits', label: 'ограничения телеметрии', terms: ['огранич', 'gap', 'coverage', 'неизвест'] },
        { id: 'contain', label: 'containment', terms: ['contain', 'локализ', 'изол', 'отозв'] },
        { id: 'business', label: 'влияние на бизнес', terms: ['бизнес', 'сервис', 'простой', 'критич'] },
      ],
      forbiddenClaims: ['вся сеть заражена', 'точно украдены все данные', 'один ip доказывает'],
    },
    finalExample: 'Facts: Word создал PowerShell, связанный процесс установил соединение, хэш вложения зафиксирован. Hypothesis: документ мог быть initial access. Scope: проверить тот же hash, user, destination и process chain на других узлах. Limitations: EDR coverage и содержимое TLS неизвестны. Containment: после фиксации volatile evidence изолировать подтверждённый endpoint и отозвать его сессии, не отключая чистые системы.',
    skillFloors: {
      soc: { theory: 36, guided: 34, independent: 18 },
      siem: { theory: 24, guided: 22, independent: 12 },
      windows: { theory: 32, guided: 28, independent: 16 },
      networking: { theory: 34, guided: 30, independent: 18 },
      incidentResponse: { theory: 22, guided: 20, independent: 12 },
      communication: { theory: 22, guided: 24, independent: 14 },
    },
  },
  {
    id: 'foundation-3',
    stage: 3,
    title: 'Автоматизация и Web: фундамент',
    subtitle: 'Код, данные, HTTP, API и SQL',
    evidenceLevel: 'guided-practice',
    scope: [
      'Python syntax и data types',
      'functions, errors и modules',
      'JSON, CSV и timestamps',
      'regex и parsing',
      'Bash pipelines',
      'PowerShell objects',
      'Git workflow и tests',
      'HTTP methods, headers и status',
      'cookies, sessions и tokens',
      'authentication и authorization',
      'SQL и parameterized queries',
      'API, input validation и logging',
    ],
    sourceIds: ['cs50-cyber', 'stanford-cs155', 'berkeley-cs161', 'portswigger', 'owasp'],
    evidence: [
      'разделяет authentication и authorization',
      'понимает parameterized SQL и object-level access control',
      'читает JSONL pipeline и обрабатывает malformed input',
      'пишет Python-фрагмент с явной обработкой ошибок',
    ],
    limitations: [
      'Python и SQL пока не запускаются на hidden tests',
      'API является синтетическим снимком, а не живым уязвимым сервисом',
      'этап не подтверждает владение AppSec или разработкой production-кода',
    ],
    questions: [
      {
        id: 'authz',
        prompt: 'На какой вопрос отвечает authorization?',
        options: [
          { id: 'allowed', text: 'Что этой identity разрешено делать с конкретным объектом', correct: true },
          { id: 'who', text: 'Кто пользователь и как он подтвердил identity' },
          { id: 'dns', text: 'Какой IP у API' },
        ],
        explanation: 'Authentication устанавливает identity. Authorization проверяет действие и объект для этой identity.',
      },
      {
        id: 'sql',
        prompt: 'Зачем параметризовать SQL?',
        options: [
          { id: 'separate', text: 'Чтобы пользовательские данные не становились SQL-синтаксисом', correct: true },
          { id: 'authz', text: 'Чтобы автоматически проверить владельца любой строки' },
          { id: 'encrypt', text: 'Чтобы зашифровать всю базу' },
        ],
        explanation: 'Параметры снижают риск injection, но server-side authorization всё равно нужна отдельно.',
      },
      {
        id: 'errors',
        prompt: 'Как должен вести себя parser на битой строке?',
        options: [
          { id: 'handle', text: 'Зафиксировать контекст и осознанно пропустить строку или остановиться', correct: true },
          { id: 'guess', text: 'Додумать отсутствующее значение' },
          { id: 'hide', text: 'Молча завершиться с кодом успеха' },
        ],
        explanation: 'Ошибочные входные данные — штатный сценарий. Их нельзя скрывать или превращать в выдуманный результат.',
      },
      {
        id: 'tests',
        prompt: 'Зачем нужны негативные и hidden tests?',
        options: [
          { id: 'edge', text: 'Чтобы проверить corner cases и решение, которое не подогнано под один видимый пример', correct: true },
          { id: 'style', text: 'Только для проверки цвета интерфейса' },
          { id: 'speed', text: 'Только для измерения скорости интернета' },
        ],
        explanation: 'Один happy path почти ничего не говорит о надёжности parser, API или policy.',
      },
    ],
    tasks: [
      {
        id: 'json',
        title: 'Извлеки пользователей из JSONL',
        theory: 'Сначала проверь структуру и распределение данных, затем пиши программу.',
        command: "jq -r '.user' auth.jsonl | sort | uniq -c",
        accept: ['jq', 'user', 'sort', 'uniq'],
        allowedStarts: ['jq'],
        commandPatterns: ["^jq\\s+-r\\s+[\"']\\.user[\"']\\s+auth\\.jsonl\\s*\\|\\s*sort\\s*\\|\\s*uniq\\s+-c\\s*$"],
        output: '  2 analyst\n 17 svc-sync\n  1 unknown',
        evidence: 'Игрок построил воспроизводимый pipeline извлечения и агрегации JSONL.',
      },
      {
        id: 'python',
        title: 'Запусти parser',
        theory: 'CLI должен принимать вход, валидировать данные и возвращать понятный результат.',
        command: 'python analyze.py auth.jsonl --sort time',
        accept: ['python', 'analyze.py', 'auth.jsonl'],
        allowedStarts: ['python', 'python3'],
        commandPatterns: ['^python3?\\s+analyze\\.py\\s+auth\\.jsonl\\s+--sort\\s+time\\s*$'],
        output: 'loaded=20 invalid=1\nfirst=02:11:04 last=02:31:18\nsuspicious_user=svc-sync',
        evidence: 'Игрок вызвал parser с явным input и параметром сортировки.',
      },
      {
        id: 'api',
        title: 'Проверь API с сессией',
        theory: 'Клиентский интерфейс не заменяет server-side access control.',
        command: "curl -s -H 'Cookie: sid=lab_41' https://api.lab/v1/me | jq",
        accept: ['curl', 'cookie', 'api.lab', 'jq'],
        allowedStarts: ['curl'],
        commandPatterns: ["^curl\\s+-s\\s+-H\\s+[\"']Cookie:\\s*sid=lab_41[\"']\\s+https://api\\.lab/v1/me\\s*\\|\\s*jq\\s*$"],
        rejectPatterns: ['-k', '--insecure'],
        output: '{"id":41,"role":"analyst","scopes":["reports:read"]}',
        evidence: 'Игрок получил identity и scopes текущей server-side сессии.',
      },
      {
        id: 'sql',
        title: 'Проверь строки владельца',
        theory: 'WHERE ограничивает rows, но production-код должен передавать owner_id параметром из доверенной identity.',
        command: 'psql -c "SELECT id,status FROM reports WHERE owner_id = 41 ORDER BY id;"',
        accept: ['select', 'from reports', 'owner_id', 'order by'],
        allowedStarts: ['psql'],
        commandPatterns: ["^psql\\s+-c\\s+[\"']select\\s+id\\s*,\\s*status\\s+from\\s+reports\\s+where\\s+owner_id\\s*=\\s*41\\s+order\\s+by\\s+id;?[\"']\\s*$"],
        output: '901 | ready\n904 | processing',
        evidence: 'Игрок ограничил выборку конкретным owner_id и задал порядок.',
      },
      {
        id: 'tests',
        title: 'Запусти тесты перед фиксом',
        theory: 'Сначала зафиксируй baseline. После изменения тот же набор должен защищать от регрессии.',
        command: 'npm test -- --run',
        accept: ['npm', 'test'],
        allowedStarts: ['npm'],
        commandPatterns: ['^npm\\s+test\\s+--\\s+--run\\s*$'],
        output: 'PASS authz.test.ts\nPASS parser.test.ts\nTests: 18 passed',
        evidence: 'Игрок зафиксировал baseline тестов перед изменением кода.',
      },
    ],
    finalPrompt: 'Напиши Python-фрагмент: прочитай JSONL, посчитай битые строки, оставь status=success, безопасно обработай отсутствие time и выведи события по времени.',
    finalChecks: ['json.loads', 'try', 'except', 'sorted'],
    finalRubric: {
      minWords: 14,
      requiredGroups: [
        { id: 'parse', label: 'JSON parsing', terms: ['json.loads'] },
        { id: 'try', label: 'обработка исключения', terms: ['try', 'except'] },
        { id: 'invalid', label: 'учёт битых строк', terms: ['invalid', 'ошиб', 'bad'] },
        { id: 'filter', label: 'фильтр success', terms: ["status') == 'success", 'status") == "success', "status'] == 'success", 'status=success'] },
        { id: 'time', label: 'безопасное время', terms: ["get('time'", 'get("time"', 'item.get', 'event.get'] },
        { id: 'sort', label: 'сортировка', terms: ['sorted'] },
      ],
      forbiddenClaims: ['eval(', 'exec(', 'except: pass'],
    },
    finalExample: "events=[]\ninvalid=0\nfor line in file:\n    try:\n        event=json.loads(line)\n    except json.JSONDecodeError:\n        invalid += 1\n        continue\n    if event.get('status') == 'success' and event.get('time'):\n        events.append(event)\nfor event in sorted(events, key=lambda item: item.get('time', '')):\n    print(event)\nprint(f'invalid={invalid}')",
    skillFloors: {
      python: { theory: 44, guided: 38, independent: 20 },
      bash: { theory: 30, guided: 28, independent: 16 },
      powershell: { theory: 22, guided: 18, independent: 10 },
      web: { theory: 38, guided: 34, independent: 18 },
      sql: { theory: 30, guided: 26, independent: 14 },
      appsec: { theory: 22, guided: 18, independent: 10 },
      soc: { independent: 20 },
      networking: { theory: 38, guided: 32, independent: 18 },
    },
  },
];
