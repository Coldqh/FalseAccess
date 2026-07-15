export const terminalObjectiveDefinitions = [
  {
    id: 'pwd',
    label: 'Узнай, где ты находишься',
    command: 'pwd',
    why: 'pwd означает print working directory. Команда печатает полный путь текущей папки.',
    result: '/home/ilya',
  },
  {
    id: 'ls',
    label: 'Посмотри, что лежит рядом',
    command: 'ls',
    why: 'ls показывает файлы и папки в текущем каталоге. Ничего не меняет и не удаляет.',
    result: 'README.txt  cases  scripts',
  },
  {
    id: 'cd-case',
    label: 'Перейди в папку дела',
    command: 'cd cases/clinic-01',
    why: 'cd означает change directory. Путь считается от текущей папки, если не начинается с /.',
    result: 'Строка приглашения изменится на ~/cases/clinic-01.',
  },
  {
    id: 'read-brief',
    label: 'Прочитай постановку задачи',
    command: 'cat brief.txt',
    why: 'cat печатает содержимое текстового файла. Здесь файл brief.txt объясняет, что нужно исследовать.',
    result: 'Появится описание дела CLINIC-01.',
  },
  {
    id: 'grep-failed',
    label: 'Отфильтруй ошибки входа',
    command: 'grep "Failed password" auth.log',
    why: 'grep ищет строки с заданным текстом. Кавычки сохраняют пробел внутри фразы Failed password.',
    result: 'Терминал покажет только неудачные попытки входа.',
  },
  {
    id: 'inspect-processes',
    label: 'Проверь запущенные процессы',
    command: 'ps',
    why: 'Процесс — запущенная программа. ps показывает PID, пользователя и команду запуска.',
    result: 'Нужно заметить процесс из /tmp/.cache/update-agent.',
  },
] as const;

export const pythonStarter = `# Эта программа должна посчитать неудачные входы в auth.log.
# Иди по шагам слева. Пиши код ПОД комментарием нужного шага.

# [1] ПОДКЛЮЧЕНИЕ ИНСТРУМЕНТА

# [2] ПУТЬ К ФАЙЛУ

# [3] ЧТЕНИЕ ФАЙЛА

# [4] СЧЁТЧИК

# [5] ЦИКЛ ПО СТРОКАМ

    # [6] ПРОВЕРКА ТЕКУЩЕЙ СТРОКИ

        # [7] УВЕЛИЧЕНИЕ СЧЁТЧИКА

# [8] ВЫВОД РЕЗУЛЬТАТА
`;

export const pythonSolution = `# Эта программа считает неудачные входы в auth.log.

from pathlib import Path

log_path = "/home/pyodide/auth.log"
lines = Path(log_path).read_text().splitlines()
failed = 0

for line in lines:
    if "Failed password" in line:
        failed += 1

print(f"Failed logins: {failed}")
`;

export const pythonGuideSteps = [
  {
    id: 'import',
    marker: '# [1] ПОДКЛЮЧЕНИЕ ИНСТРУМЕНТА',
    title: 'Подключи Path',
    concept: 'Библиотека и import',
    instruction: 'Найди комментарий [1]. На новой строке без отступа напиши:',
    snippet: 'from pathlib import Path',
    why: 'Path — готовый инструмент Python для работы с файлами. import подключает его к программе.',
    read: 'from pathlib import Path читается: «из библиотеки pathlib подключить Path».',
    check: /from\s+pathlib\s+import\s+Path/,
  },
  {
    id: 'path',
    marker: '# [2] ПУТЬ К ФАЙЛУ',
    title: 'Сохрани адрес журнала',
    concept: 'Переменная и строка',
    instruction: 'Под комментарием [2] напиши:',
    snippet: 'log_path = "/home/pyodide/auth.log"',
    why: 'Переменная log_path хранит путь. Текст берётся в кавычки, потому что это строка.',
    read: '= не означает «равно» из математики. Здесь он записывает значение справа в имя слева.',
    check: /log_path\s*=\s*["']\/home\/pyodide\/auth\.log["']/,
  },
  {
    id: 'read',
    marker: '# [3] ЧТЕНИЕ ФАЙЛА',
    title: 'Прочитай файл в список строк',
    concept: 'Функция, метод и список',
    instruction: 'Под комментарием [3] напиши:',
    snippet: 'lines = Path(log_path).read_text().splitlines()',
    why: 'Path открывает путь, read_text читает весь текст, splitlines делит его на отдельные строки.',
    read: 'После этой строки lines содержит список. Каждый элемент списка — одна строка журнала.',
    check: /lines\s*=\s*Path\(log_path\)\.read_text\(\)\.splitlines\(\)/,
  },
  {
    id: 'counter',
    marker: '# [4] СЧЁТЧИК',
    title: 'Создай счётчик',
    concept: 'Числовая переменная',
    instruction: 'Под комментарием [4] напиши:',
    snippet: 'failed = 0',
    why: 'До проверки строк найдено ноль ошибок. Переменная failed будет хранить количество совпадений.',
    read: 'Счётчик начинается с 0 и увеличивается каждый раз, когда найден Failed password.',
    check: /failed\s*=\s*0/,
  },
  {
    id: 'loop',
    marker: '# [5] ЦИКЛ ПО СТРОКАМ',
    title: 'Возьми строки по одной',
    concept: 'Цикл for',
    instruction: 'Под комментарием [5] без отступа напиши:',
    snippet: 'for line in lines:',
    why: 'Цикл повторит вложенный код для каждой строки из списка lines.',
    read: 'Двоеточие открывает блок. Всё внутри цикла должно иметь отступ в четыре пробела.',
    check: /for\s+line\s+in\s+lines\s*:/,
  },
  {
    id: 'condition',
    marker: '    # [6] ПРОВЕРКА ТЕКУЩЕЙ СТРОКИ',
    title: 'Проверь текущую строку',
    concept: 'Условие if и оператор in',
    instruction: 'Под комментарием [6] напиши строку с ЧЕТЫРЬМЯ пробелами в начале:',
    snippet: '    if "Failed password" in line:',
    why: 'if выполняет вложенный код только тогда, когда фраза найдена в текущей строке.',
    read: 'in проверяет наличие текста. Двоеточие снова открывает вложенный блок.',
    check: /^ {4}if\s+["']Failed password["']\s+in\s+line\s*:/m,
  },
  {
    id: 'increment',
    marker: '        # [7] УВЕЛИЧЕНИЕ СЧЁТЧИКА',
    title: 'Увеличь счётчик',
    concept: 'Изменение значения',
    instruction: 'Под комментарием [7] напиши строку с ВОСЕМЬЮ пробелами в начале:',
    snippet: '        failed += 1',
    why: 'Строка выполняется только внутри if. Каждое совпадение добавляет к failed единицу.',
    read: 'failed += 1 — короткая запись failed = failed + 1.',
    check: /^ {8}failed\s*\+=\s*1/m,
  },
  {
    id: 'print',
    marker: '# [8] ВЫВОД РЕЗУЛЬТАТА',
    title: 'Покажи результат',
    concept: 'print и f-строка',
    instruction: 'Под комментарием [8] без отступа напиши:',
    snippet: 'print(f"Failed logins: {failed}")',
    why: 'print выводит текст. Буква f разрешает вставить значение failed внутрь фигурных скобок.',
    read: 'Эта строка находится после цикла, поэтому печатает один итог, а не результат после каждой строки.',
    check: /print\s*\(\s*f["']Failed logins:\s*\{failed\}["']\s*\)/,
  },
] as const;

export const authLog = `Mar 14 21:08:11 clinic-ws sshd[1092]: Accepted password for nurse from 10.14.2.18 port 55192 ssh2
Mar 14 21:11:42 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2
Mar 14 21:11:44 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2
Mar 14 21:11:47 clinic-ws sshd[1188]: Failed password for root from 185.44.17.92 port 43110 ssh2
Mar 14 21:12:02 clinic-ws sshd[1195]: Failed password for invalid user postgres from 185.44.17.92 port 43188 ssh2
Mar 14 21:12:16 clinic-ws sshd[1201]: Failed password for invalid user oracle from 185.44.17.92 port 43212 ssh2
Mar 14 21:12:20 clinic-ws sshd[1201]: Failed password for root from 185.44.17.92 port 43212 ssh2
Mar 14 21:17:08 clinic-ws sshd[1280]: Accepted publickey for backup from 10.14.2.5 port 55722 ssh2`;

export const createInitialProgress = () => ({
  booted: false,
  onboardingDone: false,
  academyLessons: [] as string[],
  terminalObjectives: [] as string[],
  pythonLessonStep: 0,
  pythonComplete: false,
  alertReviewed: false,
  reportSubmitted: false,
  interviewComplete: false,
  interviewScore: 0,
  jobOfferUnlocked: false,
  jobAccepted: false,
  firstShiftComplete: false,
  firstShiftMistakes: 0,
  readMail: [] as string[],
  readMessages: [] as string[],
  notes: '',
  balance: 2400,
  contractOffers: [],
  activeContract: null,
  completedContracts: [],
  factionRep: { line: 0, north: 0, sfera: 0 },
  contractRefreshes: 0,
});
