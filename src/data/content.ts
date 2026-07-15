export const terminalObjectiveDefinitions = [
  { id: 'pwd', label: 'Проверь текущую папку', hint: 'Команда pwd печатает полный путь.' },
  { id: 'ls', label: 'Посмотри содержимое каталога', hint: 'Используй ls или ls -la.' },
  { id: 'cd-case', label: 'Перейди в каталог дела', hint: 'cd cases/clinic-01' },
  { id: 'read-brief', label: 'Прочитай вводную', hint: 'cat brief.txt' },
  { id: 'grep-failed', label: 'Найди ошибки входа', hint: 'grep "Failed password" auth.log' },
  { id: 'inspect-processes', label: 'Проверь процессы', hint: 'Команда ps покажет запущенные процессы.' },
];

export const pythonStarter = `from pathlib import Path

log_path = "/home/pyodide/auth.log"
lines = Path(log_path).read_text().splitlines()

failed = 0

# Пройди по строкам файла.
# Если строка содержит "Failed password", увеличь failed на 1.

print(f"Failed logins: {failed}")
`;

export const pythonSolution = `from pathlib import Path

log_path = "/home/pyodide/auth.log"
lines = Path(log_path).read_text().splitlines()

failed = 0

for line in lines:
    if "Failed password" in line:
        failed += 1

print(f"Failed logins: {failed}")
`;

export const authLog = `Mar 14 21:08:11 clinic-ws sshd[1092]: Accepted password for nurse from 10.14.2.18 port 55192 ssh2
Mar 14 21:11:42 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2
Mar 14 21:11:44 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2
Mar 14 21:11:47 clinic-ws sshd[1188]: Failed password for root from 185.44.17.92 port 43110 ssh2
Mar 14 21:12:02 clinic-ws sshd[1195]: Failed password for invalid user postgres from 185.44.17.92 port 43188 ssh2
Mar 14 21:12:16 clinic-ws sshd[1201]: Failed password for invalid user oracle from 185.44.17.92 port 43212 ssh2
Mar 14 21:12:20 clinic-ws sshd[1201]: Failed password for root from 185.44.17.92 port 43212 ssh2
Mar 14 21:17:08 clinic-ws sshd[1280]: Accepted publickey for backup from 10.14.2.5 port 55722 ssh2`;

export const syntaxLessons = [
  {
    key: 'variable',
    title: 'Переменная',
    code: 'failed = 0',
    text: 'Имя слева хранит значение справа. Здесь failed начинается с нуля.',
  },
  {
    key: 'loop',
    title: 'Цикл for',
    code: 'for line in lines:\n    print(line)',
    text: 'Цикл берёт элементы списка по одному. Внутренний код пишется с отступом в четыре пробела.',
  },
  {
    key: 'condition',
    title: 'Условие if',
    code: 'if "Failed" in line:\n    failed += 1',
    text: 'Код под if выполняется только при истинном условии. Оператор in проверяет наличие текста в строке.',
  },
  {
    key: 'increment',
    title: 'Изменение значения',
    code: 'failed += 1',
    text: 'Короткая запись failed = failed + 1.',
  },
  {
    key: 'fstring',
    title: 'f-строка',
    code: 'print(f"Failed logins: {failed}")',
    text: 'Буква f разрешает вставить значение переменной в фигурных скобках.',
  },
];

export const createInitialProgress = () => ({
  booted: false,
  onboardingDone: false,
  terminalObjectives: [] as string[],
  pythonComplete: false,
  alertReviewed: false,
  reportSubmitted: false,
  jobOfferUnlocked: false,
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
