export const routeAccessLog = `{"time":"2026-03-18T02:12:44+03:00","ip":"203.0.113.44","method":"POST","path":"/login","status":401,"user":"dispatcher","session":""}
{"time":"2026-03-18T02:12:51+03:00","ip":"203.0.113.44","method":"POST","path":"/login","status":401,"user":"dispatcher","session":""}
{"time":"2026-03-18T02:13:03+03:00","ip":"203.0.113.44","method":"POST","path":"/login","status":401,"user":"dispatcher","session":""}
{"time":"2026-03-18T02:14:02+03:00","ip":"198.51.100.27","method":"GET","path":"/admin","status":302,"user":"dispatcher","session":"rt_8f31c"}
{"time":"2026-03-18T02:14:04+03:00","ip":"198.51.100.27","method":"GET","path":"/admin/orders","status":200,"user":"dispatcher","session":"rt_8f31c"}
{"time":"2026-03-18T02:16:19+03:00","ip":"198.51.100.27","method":"POST","path":"/admin/export","status":200,"user":"dispatcher","session":"rt_8f31c"}
{"time":"2026-03-18T02:19:11+03:00","ip":"10.42.0.9","method":"GET","path":"/health","status":200,"user":"monitor","session":"monitor"}`;

export const routeSessionsLog = `{"time":"2026-03-17T18:42:09+03:00","event":"session_created","user":"dispatcher","ip":"10.42.0.18","session":"rt_8f31c","source":"office-pc-04"}
{"time":"2026-03-18T02:14:02+03:00","event":"session_used","user":"dispatcher","ip":"198.51.100.27","session":"rt_8f31c","source":"external"}
{"time":"2026-03-18T02:20:00+03:00","event":"session_revoked","user":"dispatcher","ip":"10.42.0.5","session":"rt_8f31c","source":"admin-console"}`;

export const routeAuditLog = `{"time":"2026-03-18T02:14:04+03:00","event":"admin_opened","user":"dispatcher","object":"orders"}
{"time":"2026-03-18T02:16:19+03:00","event":"orders_exported","user":"dispatcher","object":"orders_2026-03-18.csv","rows":1842}`;

export const routeTerminalObjectives = [
  {
    id: 'pwd', command: 'pwd', title: 'Проверь текущую папку',
    explanation: 'pwd показывает, где сейчас находится терминал. Команда ничего не меняет.',
    output: '/home/ilya/cases',
  },
  {
    id: 'ls', command: 'ls', title: 'Найди архив дела',
    explanation: 'ls выводит файлы и папки в текущем каталоге.',
    output: 'clinic-01  route-01',
  },
  {
    id: 'cd', command: 'cd route-01', title: 'Перейди в дело',
    explanation: 'cd меняет текущую папку. После команды короткие имена файлов будут работать внутри route-01.',
    output: '',
  },
  {
    id: 'tree', command: 'tree', title: 'Посмотри структуру',
    explanation: 'tree показывает дерево файлов. Сначала понимаем, какие источники данных вообще есть.',
    output: '.\n├── brief.txt\n├── access.jsonl\n├── sessions.jsonl\n└── audit.jsonl',
  },
  {
    id: 'admin', command: 'grep "\\/admin" access.jsonl', title: 'Найди запросы к админке',
    explanation: 'grep оставляет только строки с /admin. Так мы отделяем административные действия от обычного трафика.',
    output: '02:14:02 198.51.100.27 GET /admin 302 session=rt_8f31c\n02:14:04 198.51.100.27 GET /admin/orders 200 session=rt_8f31c\n02:16:19 198.51.100.27 POST /admin/export 200 session=rt_8f31c',
  },
  {
    id: 'fails', command: 'grep "\\\"status\\\":401" access.jsonl', title: 'Отдели отказы входа',
    explanation: 'Код 401 означает, что запрос не прошёл аутентификацию. Эти три строки ещё не доказывают успешный вход.',
    output: '3 строки · источник 203.0.113.44 · пользователь dispatcher',
  },
  {
    id: 'sessions', command: 'cat sessions.jsonl', title: 'Проверь сессии',
    explanation: 'Cookie с идентификатором сессии позволяет серверу узнать уже вошедшего пользователя. Сравни время, IP и session.',
    output: '18:42:09 session_created dispatcher 10.42.0.18 rt_8f31c\n02:14:02 session_used dispatcher 198.51.100.27 rt_8f31c\n02:20:00 session_revoked dispatcher 10.42.0.5 rt_8f31c',
  },
] as const;

export const routePythonStarter = `from pathlib import Path
# [1] JSON

# [2] ФУНКЦИЯ ЧТЕНИЯ


# [3] ОБЪЕДИНЕНИЕ

# [4] СОРТИРОВКА

# [5] ЦИКЛ

    # [6] ФИЛЬТР СЕССИИ

        # [7] ВЫВОД
`;

export const routePythonSteps = [
  {
    id: 'json', marker: '# [1] JSON', title: 'Подключи JSON',
    text: 'Файлы JSONL состоят из отдельных JSON-объектов по одному на строку. Подключи модуль json.',
    snippet: 'import json', check: /import\s+json/,
  },
  {
    id: 'function', marker: '# [2] ФУНКЦИЯ ЧТЕНИЯ', title: 'Создай функцию чтения',
    text: 'Функция убирает повторение: один и тот же код прочитает любой журнал.',
    snippet: 'def load(name):\n    return [json.loads(line) for line in Path(name).read_text().splitlines()]',
    check: /def\s+load\s*\(name\)\s*:[\s\S]*json\.loads\(line\)/,
  },
  {
    id: 'merge', marker: '# [3] ОБЪЕДИНЕНИЕ', title: 'Объедини журналы',
    text: 'Оператор + соединяет два списка событий в один.',
    snippet: 'events = load("/home/pyodide/access.jsonl") + load("/home/pyodide/sessions.jsonl")',
    check: /events\s*=\s*load\(["']\/home\/pyodide\/access\.jsonl["']\)\s*\+\s*load\(["']\/home\/pyodide\/sessions\.jsonl["']\)/,
  },
  {
    id: 'sort', marker: '# [4] СОРТИРОВКА', title: 'Отсортируй по времени',
    text: 'В разных файлах события записаны отдельно. Сортировка собирает единую временную линию.',
    snippet: 'events.sort(key=lambda event: event["time"])',
    check: /events\.sort\s*\(\s*key\s*=\s*lambda\s+event\s*:\s*event\[["']time["']\]\s*\)/,
  },
  {
    id: 'loop', marker: '# [5] ЦИКЛ', title: 'Перебери события',
    text: 'Цикл берёт события по одному. Всё внутри него начинается с четырёх пробелов.',
    snippet: 'for event in events:', check: /for\s+event\s+in\s+events\s*:/,
  },
  {
    id: 'filter', marker: '    # [6] ФИЛЬТР СЕССИИ', title: 'Оставь нужную сессию',
    text: 'get безопасно читает поле session. Если поля нет, Python вернёт пустую строку.',
    snippet: '    if event.get("session") == "rt_8f31c":',
    check: /^ {4}if\s+event\.get\(["']session["']\)\s*==\s*["']rt_8f31c["']\s*:/m,
  },
  {
    id: 'print', marker: '        # [7] ВЫВОД', title: 'Выведи временную линию',
    text: 'Печатаем время, тип события, IP и путь. get нужен, потому что поля path нет в журнале сессий.',
    snippet: '        print(event["time"], event.get("event", event.get("method")), event.get("ip"), event.get("path", "-"), event.get("session"))',
    check: /^ {8}print\s*\(event\[["']time["']\][\s\S]*event\.get\(["']ip["']\)/m,
  },
] as const;

export const routeBrowserQuestions = [
  {
    id: 'method', label: 'Какой метод отправляет форма входа?',
    options: [{ id: 'get', text: 'GET' }, { id: 'post', text: 'POST', correct: true }, { id: 'delete', text: 'DELETE' }],
  },
  {
    id: '401', label: 'Что означает ответ 401?',
    options: [{ id: 'ok', text: 'Запрос выполнен' }, { id: 'auth', text: 'Аутентификация не пройдена', correct: true }, { id: 'missing', text: 'Страница не существует' }],
  },
  {
    id: 'cookie', label: 'Что связывает запросы с уже вошедшим пользователем?',
    options: [{ id: 'cookie', text: 'Cookie с идентификатором сессии', correct: true }, { id: 'dns', text: 'DNS-запись' }, { id: 'html', text: 'HTML-заголовок страницы' }],
  },
] as const;

export const routeFindingSections = [
  {
    id: 'entry', label: 'Как появился доступ?', options: [
      { id: 'brute', text: 'Пароль успешно подобрали после трёх попыток.' },
      { id: 'session', text: 'Внешний адрес использовал уже существующую сессию rt_8f31c.', correct: true },
      { id: 'admin', text: 'Администратор сам вошёл ночью.' },
    ],
  },
  {
    id: 'source', label: 'Какой адрес открыл админку?', options: [
      { id: '198', text: '198.51.100.27', correct: true },
      { id: '203', text: '203.0.113.44' },
      { id: 'internal', text: '10.42.0.18' },
    ],
  },
  {
    id: 'action', label: 'Что сделали в панели?', options: [
      { id: 'view', text: 'Только открыли страницу входа.' },
      { id: 'export', text: 'Открыли заказы и выгрузили 1842 строки.', correct: true },
      { id: 'delete', text: 'Удалили все заказы.' },
    ],
  },
  {
    id: 'unknown', label: 'Что пока неизвестно?', options: [
      { id: 'cookie-source', text: 'Каким способом посторонний получил cookie rt_8f31c.', correct: true },
      { id: 'admin-ip', text: 'IP, открывший админку.' },
      { id: 'user', text: 'Имя учётной записи.' },
    ],
  },
] as const;

export const routeReportSections = [
  {
    id: 'summary', label: 'Краткий вывод', options: [
      { id: 'session-reuse', text: 'Административная сессия dispatcher была повторно использована с внешнего IP.', correct: true },
      { id: 'bruteforce', text: 'Пароль dispatcher был подобран перебором.' },
      { id: 'no-incident', text: 'Инцидента не было.' },
    ],
  },
  {
    id: 'evidence', label: 'Доказательства', options: [
      { id: 'timeline', text: 'Одинаковый session rt_8f31c: создан внутри офиса, затем использован с 198.51.100.27.', correct: true },
      { id: 'fails-only', text: 'Три ответа 401 сами по себе доказывают компрометацию.' },
      { id: 'guess', text: 'Сотрудник продал пароль.' },
    ],
  },
  {
    id: 'impact', label: 'Подтверждённое действие', options: [
      { id: 'export', text: 'Открыта административная панель и выгружено 1842 заказа.', correct: true },
      { id: 'database', text: 'База полностью уничтожена.' },
      { id: 'payment', text: 'Изменены банковские реквизиты.' },
    ],
  },
  {
    id: 'recommendation', label: 'Первое действие', options: [
      { id: 'revoke', text: 'Отозвать активные сессии, сменить пароль dispatcher и сохранить журналы.', correct: true },
      { id: 'wipe', text: 'Удалить сервер и все журналы.' },
      { id: 'ignore', text: 'Ничего не делать, потому что пароль не подобрали.' },
    ],
  },
] as const;

export type RouteCaseChoice = 'full' | 'safe' | 'lie' | 'refuse' | 'owner' | 'anna';

export const routeDecisionOptions: Array<{ id: RouteCaseChoice; title: string; text: string; pay: number }> = [
  { id: 'full', title: 'Отправить всё', text: 'IP, время, учётку и cookie. Игорь получает полный набор.', pay: 8000 },
  { id: 'safe', title: 'Убрать cookie', text: 'Отправить факты инцидента, но не передавать действующую сессию.', pay: 5000 },
  { id: 'lie', title: 'Сказать, что cookie нет', text: 'Отправить IP, время и учётку. Сессию скрыть.', pay: 3500 },
  { id: 'refuse', title: 'Отказаться', text: 'Не передавать материалы после анализа.', pay: 0 },
  { id: 'owner', title: 'Предупредить владельца', text: 'Передать безопасный отчёт службе доставки.', pay: 2500 },
  { id: 'anna', title: 'Сообщить Анне', text: 'Передать материалы в «Сферу» и признаться в подработке.', pay: 0 },
];
