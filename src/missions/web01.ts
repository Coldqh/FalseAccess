export const webCaseOverview = [
  { label: 'CASE', value: 'VANTA-04' },
  { label: 'TARGET', value: 'VANTA LEDGER / закрытый расчётный портал' },
  { label: 'STACK', value: 'React / Node API / PostgreSQL' },
  { label: 'ACCOUNT', value: 'client-41 / обычный пользователь' },
  { label: 'SYMPTOM', value: 'чужие расчёты открываются по прямому ID' },
  { label: 'MODE', value: 'изолированная копия / тестовые данные' },
] as const;

export const webArchitecture = [
  { id: 'browser', role: 'CLIENT', title: 'Browser', subtitle: 'HTML / JS / cookie', address: 'vanta.local' },
  { id: 'api', role: 'API', title: 'ledger-api', subtitle: 'Node.js / JSON', address: '/api/v1' },
  { id: 'session', role: 'SESSION', title: 'session-store', subtitle: 'sid → user_id', address: 'Redis clone' },
  { id: 'db', role: 'DB', title: 'ledger-db', subtitle: 'PostgreSQL', address: 'settlements' },
] as const;

export const webFoundationQuestions = [
  {
    id: 'request', label: 'Из чего состоит HTTP-запрос?', options: [
      { id: 'parts', text: 'Метод, путь, заголовки и при необходимости тело.', correct: true },
      { id: 'database', text: 'Только SQL-запрос и пароль базы.' },
      { id: 'screen', text: 'Только HTML, который виден на экране.' },
    ],
  },
  {
    id: 'status', label: 'Что обычно означают 401 и 403?', options: [
      { id: 'auth', text: '401 — нет подтверждённой сессии; 403 — сессия есть, но действие запрещено.', correct: true },
      { id: 'same', text: 'Оба кода всегда означают, что сервер выключен.' },
      { id: 'redirect', text: '401 — успешный вход, 403 — перенаправление.' },
    ],
  },
  {
    id: 'cookie', label: 'Зачем приложению session cookie?', options: [
      { id: 'link', text: 'Чтобы связать последующие запросы браузера с серверной сессией пользователя.', correct: true },
      { id: 'encrypt', text: 'Чтобы автоматически шифровать базу данных.' },
      { id: 'role', text: 'Чтобы выдать пользователю права администратора.' },
    ],
  },
  {
    id: 'api', label: 'Что такое API в этой главе?', options: [
      { id: 'interface', text: 'Набор адресов и правил, через которые клиент запрашивает данные и выполняет действия.', correct: true },
      { id: 'antivirus', text: 'Встроенный антивирус браузера.' },
      { id: 'storage', text: 'Любой файл с расширением .api.' },
    ],
  },
] as const;

export const webGuidedObjectives = [
  {
    id: 'me', title: 'Проверь текущую сессию',
    explanation: 'Cookie sid передаётся в заголовке Cookie. Сервер находит сессию и возвращает пользователя, связанного с ней.',
    command: `curl -i https://vanta.local/api/v1/me -H "Cookie: sid=sid_41_a71c"`,
    output: `HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: no-store\n\n{"id":41,"login":"client-41","role":"client"}`,
  },
  {
    id: 'own', title: 'Открой собственный расчёт',
    explanation: 'Аутентификация уже пройдена. Теперь сервер должен проверить, принадлежит ли объект пользователю.',
    command: `curl -i https://vanta.local/api/v1/settlements/901 -H "Cookie: sid=sid_41_a71c"`,
    output: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":901,"owner_id":41,"amount":184000,"status":"held","counterparty":"K-Transit"}`,
  },
  {
    id: 'foreign', title: 'Проверь соседний ID',
    explanation: 'Меняется только ID объекта. Если сервер вернёт чужой объект, значит проверка владения отсутствует.',
    command: `curl -i https://vanta.local/api/v1/settlements/902 -H "Cookie: sid=sid_41_a71c"`,
    output: `HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"id":902,"owner_id":42,"amount":920000,"status":"released","counterparty":"City Procurement Office"}`,
  },
  {
    id: 'anonymous', title: 'Повтори запрос без cookie',
    explanation: 'Так мы отделяем аутентификацию от авторизации. Без сессии сервер должен отказать ещё до проверки объекта.',
    command: `curl -i https://vanta.local/api/v1/settlements/902`,
    output: `HTTP/1.1 401 Unauthorized\nContent-Type: application/json\n\n{"error":"session_required"}`,
  },
] as const;

export const webSessionQuestions = [
  {
    id: 'bug', label: 'Что уже доказано?', options: [
      { id: 'bola', text: 'Пользователь 41 с рабочей сессией получил объект владельца 42. Проверка доступа к объекту отсутствует.', correct: true },
      { id: 'stolen', text: 'Cookie пользователя 42 точно украдена.' },
      { id: 'admin', text: 'Пользователь 41 стал администратором.' },
    ],
  },
  {
    id: 'authz', label: 'Где должна выполняться проверка доступа?', options: [
      { id: 'server', text: 'На сервере для каждого объекта и действия, независимо от того, что скрывает интерфейс.', correct: true },
      { id: 'button', text: 'Только в браузере: достаточно спрятать кнопку.' },
      { id: 'cookie', text: 'Достаточно проверить, что cookie вообще существует.' },
    ],
  },
  {
    id: 'flags', label: 'Какие свойства cookie уменьшают риск её кражи и неверной передачи?', options: [
      { id: 'secure', text: 'HttpOnly, Secure и подходящий SameSite; плюс короткий срок и ротация после важных событий.', correct: true },
      { id: 'public', text: 'Сделать cookie доступной любому JavaScript и отправлять по HTTP.' },
      { id: 'role', text: 'Записать в cookie role=admin без серверной проверки.' },
    ],
  },
  {
    id: 'logout', label: 'Что должен делать корректный logout?', options: [
      { id: 'invalidate', text: 'Удалить или отозвать серверную сессию и очистить cookie в браузере.', correct: true },
      { id: 'hide', text: 'Только закрыть вкладку браузера.' },
      { id: 'rename', text: 'Переименовать cookie, не меняя запись на сервере.' },
    ],
  },
] as const;

export const webVulnerableRoute = `app.get("/api/v1/settlements/:id", requireSession, async (req, res) => {
  const id = Number(req.params.id)
  const result = await db.query(
    "SELECT id, owner_id, amount, status, counterparty FROM settlements WHERE id = $1",
    [id]
  )

  if (!result.rows[0]) return res.status(404).json({ error: "not_found" })
  return res.json(result.rows[0])
})`;

export const webSecureRoute = `app.get("/api/v1/settlements/:id", requireSession, async (req, res) => {
  const id = Number(req.params.id)
  const result = await db.query(
    "SELECT id, owner_id, amount, status, counterparty FROM settlements WHERE id = $1 AND owner_id = $2",
    [id, req.user.id]
  )

  if (!result.rows[0]) return res.status(404).json({ error: "not_found" })
  return res.json(result.rows[0])
})`;

export const webSqlObjectives = [
  {
    id: 'own-rows', title: 'Выбери строки владельца 41',
    explanation: 'SELECT задаёт поля, FROM — таблицу, WHERE ограничивает строки, ORDER BY задаёт порядок результата.',
    command: 'SELECT id, owner_id, amount, status FROM settlements WHERE owner_id = 41 ORDER BY id;',
    output: ` id  | owner_id | amount | status\n-----+----------+--------+--------\n 901 |       41 | 184000 | held\n 905 |       41 |  72000 | released\n(2 rows)`,
  },
  {
    id: 'audit', title: 'Проверь аудит по сессии',
    explanation: 'Лог приложения нужен, чтобы понять масштаб. Один успешный тест не доказывает, сколько чужих объектов открывали раньше.',
    command: `SELECT time, user_id, object_id, status FROM audit_log WHERE session_id = 'sid_41_a71c' ORDER BY time;`,
    output: ` time     | user_id | object_id | status\n----------+---------+-----------+-------\n 02:11:04 |      41 |       901 | 200\n 02:11:11 |      41 |       902 | 200\n 02:11:19 |      41 |       903 | 200\n(3 rows)`,
  },
] as const;

export const webCodeQuestions = [
  {
    id: 'parameter', label: 'Почему параметризованный SQL всё равно нужен?', options: [
      { id: 'data', text: 'Он отделяет данные от текста запроса и снижает риск SQL-инъекции. Проверку прав он не заменяет.', correct: true },
      { id: 'authz', text: 'Параметры автоматически проверяют владельца любой строки.' },
      { id: 'speed', text: 'Они нужны только для ускорения интерфейса.' },
    ],
  },
  {
    id: 'missing', label: 'Чего не хватает в исходном маршруте?', options: [
      { id: 'owner', text: 'Ограничения по owner_id или отдельной серверной проверки разрешения на объект.', correct: true },
      { id: 'css', text: 'CSS-класса для скрытия чужих строк.' },
      { id: 'port', text: 'Смены порта API с 443 на другой.' },
    ],
  },
] as const;

export const webIndependentCommands = [
  {
    id: 'identity', command: `curl -s https://vault.vanta.local/api/v2/me -H "Cookie: sid=sid_17_ops"`,
    output: `{"id":17,"login":"ops-17","role":"operator"}`,
  },
  {
    id: 'own-file', command: `curl -s https://vault.vanta.local/api/v2/files/18 -H "Cookie: sid=sid_17_ops"`,
    output: `{"id":18,"owner_id":17,"name":"shift-note.txt","classification":"internal"}`,
  },
  {
    id: 'foreign-file', command: `curl -s https://vault.vanta.local/api/v2/files/19 -H "Cookie: sid=sid_17_ops"`,
    output: `{"id":19,"owner_id":18,"name":"payments-q3.csv","classification":"restricted"}`,
  },
  {
    id: 'route', command: 'cat routes-files.js',
    output: `router.get('/files/:id', requireSession, async (req, res) => {\n  const row = await db.oneOrNone('SELECT * FROM files WHERE id = $1', [req.params.id])\n  if (!row) return res.sendStatus(404)\n  res.json(row)\n})`,
  },
  {
    id: 'schema', command: 'cat schema.sql',
    output: `CREATE TABLE files (\n  id bigint PRIMARY KEY,\n  owner_id bigint NOT NULL REFERENCES users(id),\n  name text NOT NULL,\n  classification text NOT NULL\n);\nCREATE INDEX files_owner_idx ON files(owner_id);`,
  },
] as const;

export const webIndependentQuestions = [
  {
    id: 'finding', label: 'Что повторяется во втором сервисе?', options: [
      { id: 'bola', text: 'Оператор 17 получает файл владельца 18 по прямому ID. Сервер проверяет сессию, но не владение объектом.', correct: true },
      { id: 'sql', text: 'База не поддерживает WHERE.' },
      { id: 'cookie', text: 'Сессия пользователя 17 не работает.' },
    ],
  },
  {
    id: 'fix', label: 'Какой минимальный серверный фикс нужен?', options: [
      { id: 'owner', text: 'Добавить owner_id = req.user.id в запрос или централизованную policy-проверку перед выдачей файла.', correct: true },
      { id: 'hide', text: 'Убрать ссылку на файл из интерфейса.' },
      { id: 'random', text: 'Сделать ID длиннее и оставить маршрут без проверки.' },
    ],
  },
  {
    id: 'scope', label: 'Что нужно проверить после исправления?', options: [
      { id: 'all', text: 'Все маршруты, которые получают объект по ID, тесты прав, аудит прежних обращений и отзыв активных сессий при необходимости.', correct: true },
      { id: 'one', text: 'Только файл 19.' },
      { id: 'css', text: 'Только цвет кнопки в браузере.' },
    ],
  },
] as const;

export const webFindingSections = [
  {
    id: 'root', label: 'Корневая причина', options: [
      { id: 'authz', text: 'API подтверждает сессию, но не проверяет право пользователя на конкретный settlement или file.', correct: true },
      { id: 'password', text: 'Подтверждён перебор пароля администратора.' },
      { id: 'db-down', text: 'PostgreSQL был недоступен.' },
    ],
  },
  {
    id: 'impact', label: 'Подтверждённый эффект', options: [
      { id: 'read', text: 'Два обычных аккаунта смогли читать чужие объекты через изменение ID.', correct: true },
      { id: 'write', text: 'Подтверждено изменение банковских переводов.' },
      { id: 'admin', text: 'Подтверждено получение прав администратора.' },
    ],
  },
  {
    id: 'unknown', label: 'Что пока не доказано', options: [
      { id: 'history', text: 'Полный объём прежнего доступа и факт выгрузки всех данных без полного аудита и дополнительных журналов.', correct: true },
      { id: 'foreign', text: 'Сам факт чтения объекта владельца 42.' },
      { id: 'code', text: 'Отсутствие owner_id в двух маршрутах.' },
    ],
  },
] as const;

export const webReportSections = [
  {
    id: 'classification', label: 'Класс проблемы', options: [
      { id: 'bola', text: 'Broken Object Level Authorization: сервер не проверяет доступ к объекту после аутентификации.', correct: true },
      { id: 'xss', text: 'Stored XSS подтверждён во всех формах.' },
      { id: 'dos', text: 'Отказ в обслуживании базы данных.' },
    ],
  },
  {
    id: 'fix', label: 'Исправление', options: [
      { id: 'policy', text: 'Серверная policy-проверка или запрос по id + owner_id, параметризованный SQL и единые тесты авторизации.', correct: true },
      { id: 'frontend', text: 'Скрыть ID в HTML и ничего не менять на API.' },
      { id: 'port', text: 'Перенести API на другой порт.' },
    ],
  },
  {
    id: 'sessions', label: 'Сессии', options: [
      { id: 'controls', text: 'Проверить HttpOnly/Secure/SameSite, срок жизни, logout, ротацию и при необходимости отозвать активные сессии.', correct: true },
      { id: 'forever', text: 'Сделать cookie бессрочной.' },
      { id: 'client-role', text: 'Хранить доверенную роль только в JavaScript.' },
    ],
  },
  {
    id: 'validation', label: 'Проверка после фикса', options: [
      { id: 'tests', text: 'Негативные тесты доступа между пользователями, тесты ролей, проверка журнала и повторный аудит похожих маршрутов.', correct: true },
      { id: 'open', text: 'Проверить только, что главная страница открывается.' },
      { id: 'delete', text: 'Удалить audit_log, чтобы не было старых ошибок.' },
    ],
  },
] as const;
