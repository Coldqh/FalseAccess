export const terminalObjectiveDefinitions = [
  {
    id: 'pwd',
    label: 'Текущая папка',
    command: 'pwd',
    mentor: 'Начнём с места, где ты сейчас находишься.',
    reply: 'Введи pwd. Команда покажет полный путь.',
    why: 'pwd печатает текущую папку.',
    result: '/home/ilya',
    after: '/home/ilya. Это твоя домашняя папка. Теперь посмотрим, что внутри.',
  },
  {
    id: 'ls',
    label: 'Содержимое папки',
    command: 'ls',
    mentor: 'Введи ls.',
    reply: 'Он покажет файлы и папки здесь.',
    why: 'ls показывает содержимое папки.',
    result: 'README.txt  cases  scripts',
    after: 'Вижу cases. Там лежат материалы дела.',
  },
  {
    id: 'cd-case',
    label: 'Папка CLINIC-01',
    command: 'cd cases/clinic-01',
    mentor: 'Перейди в дело: cd cases/clinic-01.',
    reply: 'cd меняет текущую папку. Путь cases/clinic-01 считается от /home/ilya.',
    why: 'cd меняет текущую папку.',
    result: '~/cases/clinic-01',
    after: 'Мы в clinic-01. Теперь имена файлов можно писать без полного пути.',
  },
  {
    id: 'read-brief',
    label: 'Вводная по делу',
    command: 'cat brief.txt',
    mentor: 'Сначала прочитай brief.txt.',
    reply: 'Введи cat brief.txt. cat выведет текст файла.',
    why: 'cat выводит содержимое файла.',
    result: 'Описание CLINIC-01',
    after: 'Есть auth.log. В нём записи о входах по SSH.',
  },
  {
    id: 'grep-failed',
    label: 'Неудачные входы',
    command: 'grep "Failed password" auth.log',
    mentor: 'Найди строки с Failed password.',
    reply: 'Введи grep "Failed password" auth.log. grep оставит только совпадения.',
    why: 'grep ищет текст в файле.',
    result: '6 строк',
    after: 'Шесть неудачных попыток с внешнего адреса. Успешного входа это не доказывает.',
  },
  {
    id: 'inspect-processes',
    label: 'Запущенные процессы',
    command: 'ps',
    mentor: 'Теперь проверим, что запущено на компьютере.',
    reply: 'Введи ps. Смотри на PID, пользователя и путь программы.',
    why: 'ps показывает запущенные процессы.',
    result: 'PID 911 /tmp/.cache/update-agent',
    after: 'PID 911 запущен из /tmp/.cache. Путь нетипичный. Зафиксируем его и перейдём к журналу.',
  },
] as const;

export const pythonStarter = `# CLINIC-01 / analyze_auth.py

# [1] IMPORT

# [2] FILE PATH

# [3] READ LOG

# [4] COUNTER

# [5] LOOP

    # [6] CONDITION

        # [7] COUNT

# [8] OUTPUT
`;

export const pythonSolution = `# CLINIC-01 / analyze_auth.py

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
    marker: '# [1] IMPORT',
    title: 'Подключить Path',
    concept: 'import',
    instruction: 'Под [1] напиши:',
    snippet: 'from pathlib import Path',
    why: 'Нам нужно открыть файл. Path умеет работать с путями.',
    read: 'from pathlib import Path — взять Path из модуля pathlib.',
    check: /from\s+pathlib\s+import\s+Path/,
  },
  {
    id: 'path',
    marker: '# [2] FILE PATH',
    title: 'Указать файл',
    concept: 'переменная',
    instruction: 'Под [2] напиши:',
    snippet: 'log_path = "/home/pyodide/auth.log"',
    why: 'Сохраним адрес журнала под именем log_path.',
    read: 'Знак = записывает значение справа в имя слева. Текст пути стоит в кавычках.',
    check: /log_path\s*=\s*["']\/home\/pyodide\/auth\.log["']/,
  },
  {
    id: 'read',
    marker: '# [3] READ LOG',
    title: 'Прочитать журнал',
    concept: 'список строк',
    instruction: 'Под [3] напиши:',
    snippet: 'lines = Path(log_path).read_text().splitlines()',
    why: 'Прочитаем файл и разделим его на строки.',
    read: 'После этой строки lines хранит список строк из auth.log.',
    check: /lines\s*=\s*Path\(log_path\)\.read_text\(\)\.splitlines\(\)/,
  },
  {
    id: 'counter',
    marker: '# [4] COUNTER',
    title: 'Создать счётчик',
    concept: 'число',
    instruction: 'Под [4] напиши:',
    snippet: 'failed = 0',
    why: 'До проверки мы нашли ноль совпадений.',
    read: 'failed хранит число найденных строк.',
    check: /failed\s*=\s*0/,
  },
  {
    id: 'loop',
    marker: '# [5] LOOP',
    title: 'Перебрать строки',
    concept: 'for',
    instruction: 'Под [5] без отступа напиши:',
    snippet: 'for line in lines:',
    why: 'Нужно проверить каждую строку журнала.',
    read: 'for берёт строки из lines по одной. Двоеточие открывает блок кода.',
    check: /for\s+line\s+in\s+lines\s*:/,
  },
  {
    id: 'condition',
    marker: '    # [6] CONDITION',
    title: 'Проверить строку',
    concept: 'if',
    instruction: 'Под [6] напиши с четырьмя пробелами в начале:',
    snippet: '    if "Failed password" in line:',
    why: 'Счётчик нужен только для строк с Failed password.',
    read: 'if проверяет условие. in ищет фразу внутри текущей строки.',
    check: /^ {4}if\s+["']Failed password["']\s+in\s+line\s*:/m,
  },
  {
    id: 'increment',
    marker: '        # [7] COUNT',
    title: 'Добавить совпадение',
    concept: '+= 1',
    instruction: 'Под [7] напиши с восемью пробелами в начале:',
    snippet: '        failed += 1',
    why: 'Каждое совпадение увеличивает счётчик на один.',
    read: 'failed += 1 — то же самое, что failed = failed + 1.',
    check: /^ {8}failed\s*\+=\s*1/m,
  },
  {
    id: 'print',
    marker: '# [8] OUTPUT',
    title: 'Вывести итог',
    concept: 'print',
    instruction: 'Под [8] без отступа напиши:',
    snippet: 'print(f"Failed logins: {failed}")',
    why: 'Нужно увидеть итог после проверки всех строк.',
    read: 'print выводит текст. {failed} подставляет значение счётчика.',
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
