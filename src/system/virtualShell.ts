import type { ShellResult } from '../types';
import { authLog } from '../data/content';

const paths: Record<string, string[]> = {
  '/home/ilya': ['README.txt', 'cases', 'scripts'],
  '/home/ilya/cases': ['clinic-01'],
  '/home/ilya/cases/clinic-01': ['brief.txt', 'auth.log', 'processes.txt', 'network.txt'],
  '/home/ilya/scripts': [],
};

const files: Record<string, string> = {
  '/home/ilya/README.txt': `FALSE ACCESS TRAINING TERMINAL

help      список команд
mission   текущая задача
academy   краткие основы
clear     очистить экран`,
  '/home/ilya/cases/clinic-01/brief.txt': `ДЕЛО CLINIC-01

Рабочая станция регистратуры медленно отвечает.
Сотрудники сообщают о ночных попытках входа.

Задача:
1. Проверь журнал SSH.
2. Определи число неудачных входов.
3. Проверь список процессов.
4. Передай результат в SIEM.

Важно: Failed password означает неудачную попытку. Это ещё не доказательство взлома.`,
  '/home/ilya/cases/clinic-01/auth.log': authLog,
  '/home/ilya/cases/clinic-01/processes.txt': `PID USER     COMMAND
1   root     /sbin/init
412 root     /usr/sbin/sshd -D
667 nurse    /usr/bin/firefox
804 root     /usr/local/bin/clinic-backup
911 nobody   /tmp/.cache/update-agent --silent`,
  '/home/ilya/cases/clinic-01/network.txt': `10.14.2.18 clinic-ws
10.14.2.5 backup-node
10.14.2.1 gateway`,
};

function normalizePath(cwd: string, input: string): string {
  if (!input || input === '~') return '/home/ilya';
  const expanded = input.startsWith('~/') ? `/home/ilya/${input.slice(2)}` : input;
  const raw = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`;
  const parts = raw.split('/').filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}`;
}

function formatLs(path: string, detailed: boolean): string[] {
  const entries = paths[path];
  if (!entries) return [`ls: cannot access '${path}': No such directory`];
  if (!detailed) return [entries.join('  ')];
  return entries.map((entry) => {
    const full = `${path}/${entry}`;
    const isDir = Boolean(paths[full]);
    return `${isDir ? 'd' : '-'}rw${isDir ? 'x' : '-'}r-xr-x 1 ilya users ${isDir ? '4096' : String((files[full] ?? '').length).padStart(4, ' ')} Mar 14 21:20 ${entry}`;
  });
}

function readFile(cwd: string, fileName: string | undefined) {
  if (!fileName) return { target: '', error: 'missing operand' };
  const target = normalizePath(cwd, fileName);
  if (!(target in files)) return { target, error: `${fileName}: No such file` };
  return { target, content: files[target] };
}

export function runShellCommand(raw: string, cwd: string): ShellResult {
  const command = raw.trim();
  if (!command) return { lines: [] };
  const [name, ...args] = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];

  switch (name) {
    case 'help':
      return { lines: [
        'ОСНОВНЫЕ КОМАНДЫ',
        'pwd                        показать текущую папку',
        'ls [-la] [path]            показать файлы',
        'cd <path>                  перейти в папку',
        'cat <file>                 прочитать весь файл',
        'head <file>                первые 5 строк',
        'tail <file>                последние 5 строк',
        'grep [-c] <text> <file>    найти или посчитать строки',
        'wc -l <file>               количество строк',
        'ps                         показать процессы',
        'ss -tulpn                  показать сетевые порты',
        'whoami                     текущий пользователь',
        'tree                       дерево файлов',
        'mission                    текущая задача',
        'academy                    основные термины',
        'clear                      очистить терминал',
      ] };
    case 'pwd':
      return { lines: [cwd], objective: cwd === '/home/ilya' ? 'pwd' : undefined };
    case 'whoami':
      return { lines: ['ilya'] };
    case 'hostname':
      return { lines: ['fa-training-01'] };
    case 'clear':
      return { lines: [], clear: true };
    case 'echo':
      return { lines: [args.join(' ')] };
    case 'ls': {
      const detailed = args.includes('-la') || args.includes('-al') || args.includes('-l');
      const pathArg = args.find((arg) => !arg.startsWith('-'));
      const target = pathArg ? normalizePath(cwd, pathArg) : cwd;
      const lines = formatLs(target, detailed);
      return { lines, objective: target === '/home/ilya' && !lines[0]?.startsWith('ls:') ? 'ls' : undefined };
    }
    case 'cd': {
      const requested = args[0] ?? '~';
      const target = normalizePath(cwd, requested);
      if (!paths[target]) {
        return { lines: [
          `bash: cd: ${requested}: No such directory`,
          `Подсказка: ты находишься в ${cwd}. Относительный путь добавляется к этой папке.`,
          'Проверь содержимое командой ls или используй полный путь, начинающийся с /.',
        ] };
      }
      return { lines: [], cwd: target, objective: target === '/home/ilya/cases/clinic-01' ? 'cd-case' : undefined };
    }
    case 'cat': {
      const result = readFile(cwd, args[0]);
      if (result.error) return { lines: [`cat: ${result.error}`] };
      return { lines: result.content!.split('\n'), objective: result.target.endsWith('/brief.txt') ? 'read-brief' : undefined };
    }
    case 'head':
    case 'tail': {
      const result = readFile(cwd, args[0]);
      if (result.error) return { lines: [`${name}: ${result.error}`] };
      const lines = result.content!.split('\n');
      return { lines: name === 'head' ? lines.slice(0, 5) : lines.slice(-5) };
    }
    case 'wc': {
      if (args[0] !== '-l') return { lines: ['usage: wc -l <file>'] };
      const result = readFile(cwd, args[1]);
      if (result.error) return { lines: [`wc: ${result.error}`] };
      return { lines: [`${result.content!.split('\n').length} ${args[1]}`] };
    }
    case 'grep': {
      const countOnly = args[0] === '-c';
      const text = countOnly ? args[1] : args[0];
      const fileName = countOnly ? args[2] : args[1];
      if (!text || !fileName) return { lines: ['usage: grep [-c] <text> <file>'] };
      const result = readFile(cwd, fileName);
      if (result.error) return { lines: [`grep: ${result.error}`] };
      const matches = result.content!.split('\n').filter((line) => line.includes(text));
      return {
        lines: countOnly ? [String(matches.length)] : matches,
        objective: result.target.endsWith('/auth.log') && text.includes('Failed password') ? 'grep-failed' : undefined,
      };
    }
    case 'ps':
      return {
        lines: files['/home/ilya/cases/clinic-01/processes.txt'].split('\n'),
        objective: 'inspect-processes',
      };
    case 'ss':
      return { lines: [
        'Netid State  Local Address:Port  Process',
        'tcp   LISTEN 0.0.0.0:22         users:(("sshd",pid=412,fd=3))',
        'tcp   LISTEN 127.0.0.1:8080     users:(("clinic-api",pid=721,fd=7))',
        'udp   UNCONN 10.14.2.18:68      users:(("dhclient",pid=301,fd=6))',
      ] };
    case 'tree':
      return { lines: [
        '.',
        '├── README.txt',
        '├── cases',
        '│   └── clinic-01',
        '│       ├── auth.log',
        '│       ├── brief.txt',
        '│       ├── network.txt',
        '│       └── processes.txt',
        '└── scripts',
      ] };
    case 'mission':
      return { lines: [
        'CLINIC-01 / ПЕРВИЧНЫЙ ОСМОТР',
        `Текущая папка: ${cwd}`,
        'Задача: открыть дело, найти ошибки входа и проверить процессы.',
        'Слева показан следующий шаг и объяснение команды.',
      ] };
    case 'academy':
      return { lines: [
        'КРАТКИЕ ОСНОВЫ',
        'файл       данные с именем',
        'папка      контейнер для файлов',
        'путь       адрес файла или папки',
        'процесс    запущенная программа',
        'лог        записи о событиях',
        'IP         адрес устройства в сети',
        'порт       номер сетевой службы',
        'Открой приложение ACADEMY для полного объяснения.',
      ] };
    case 'man':
      return { lines: [`В учебной сборке справка собрана в help. Для команды ${args[0] ?? ''} используй боковую панель.`] };
    default:
      return { lines: [`${name}: command not found. Напиши help.`, 'Проверь раскладку, регистр и пробелы.'] };
  }
}
