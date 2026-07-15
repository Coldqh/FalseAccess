import type { ShellResult } from '../types';
import { authLog } from '../data/content';

const paths: Record<string, string[]> = {
  '/home/ilya': ['README.txt', 'cases', 'scripts'],
  '/home/ilya/cases': ['clinic-01'],
  '/home/ilya/cases/clinic-01': ['brief.txt', 'auth.log', 'processes.txt', 'network.txt'],
  '/home/ilya/scripts': [],
};

const files: Record<string, string> = {
  '/home/ilya/README.txt': `FALSE ACCESS TRAINING TERMINAL\n\nhelp      список команд\nmission   текущая задача\nclear     очистить экран`,
  '/home/ilya/cases/clinic-01/brief.txt': `ДЕЛО CLINIC-01\n\nРабочая станция регистратуры медленно отвечает.\nСотрудники сообщают о ночных попытках входа.\n\nЗадача:\n1. Проверь журнал SSH.\n2. Определи число неудачных входов.\n3. Проверь список процессов.\n4. Передай результат в SIEM.`,
  '/home/ilya/cases/clinic-01/auth.log': authLog,
  '/home/ilya/cases/clinic-01/processes.txt': `PID USER     COMMAND\n1   root     /sbin/init\n412 root     /usr/sbin/sshd -D\n667 nurse    /usr/bin/firefox\n804 root     /usr/local/bin/clinic-backup\n911 nobody   /tmp/.cache/update-agent --silent`,
  '/home/ilya/cases/clinic-01/network.txt': `10.14.2.18 clinic-ws\n10.14.2.5 backup-node\n10.14.2.1 gateway`,
};

function normalizePath(cwd: string, input: string): string {
  const raw = input.startsWith('/') ? input : `${cwd}/${input}`;
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

export function runShellCommand(raw: string, cwd: string): ShellResult {
  const command = raw.trim();
  if (!command) return { lines: [] };
  const [name, ...args] = command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];

  switch (name) {
    case 'help':
      return { lines: [
        'ОСНОВНЫЕ КОМАНДЫ',
        'pwd                 показать текущую папку',
        'ls [-la] [path]     показать файлы',
        'cd <path>           перейти в папку',
        'cat <file>          прочитать файл',
        'grep <text> <file>  найти строки',
        'ps                  показать процессы',
        'ss -tulpn           показать сетевые порты',
        'whoami              текущий пользователь',
        'tree                дерево файлов',
        'mission             активные задачи',
        'clear               очистить терминал',
      ] };
    case 'pwd':
      return { lines: [cwd], objective: 'pwd' };
    case 'whoami':
      return { lines: ['ilya'] };
    case 'hostname':
      return { lines: ['fa-training-01'] };
    case 'clear':
      return { lines: [], clear: true };
    case 'ls': {
      const detailed = args.includes('-la') || args.includes('-al') || args.includes('-l');
      const pathArg = args.find((arg) => !arg.startsWith('-'));
      const target = pathArg ? normalizePath(cwd, pathArg) : cwd;
      return { lines: formatLs(target, detailed), objective: target === '/home/ilya' ? 'ls' : undefined };
    }
    case 'cd': {
      const target = normalizePath(cwd, args[0] ?? '/home/ilya');
      if (!paths[target]) return { lines: [`bash: cd: ${args[0] ?? ''}: No such directory`] };
      return { lines: [], cwd: target, objective: target === '/home/ilya/cases/clinic-01' ? 'cd-case' : undefined };
    }
    case 'cat': {
      if (!args[0]) return { lines: ['cat: missing operand'] };
      const target = normalizePath(cwd, args[0]);
      if (!(target in files)) return { lines: [`cat: ${args[0]}: No such file`] };
      return { lines: files[target].split('\n'), objective: target.endsWith('/brief.txt') ? 'read-brief' : undefined };
    }
    case 'grep': {
      if (args.length < 2) return { lines: ['usage: grep <text> <file>'] };
      const text = args[0];
      const target = normalizePath(cwd, args[1]);
      if (!(target in files)) return { lines: [`grep: ${args[1]}: No such file`] };
      const matches = files[target].split('\n').filter((line) => line.includes(text));
      return {
        lines: matches.length ? matches : [],
        objective: target.endsWith('/auth.log') && text.includes('Failed password') ? 'grep-failed' : undefined,
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
        'Проверь рабочую станцию, найди ошибки входа и подозрительный процесс.',
        'После терминала открой CODE и напиши анализатор журнала.',
      ] };
    case 'history':
      return { lines: ['История команд хранится в текущей сессии терминала. Используй ↑ и ↓.'] };
    default:
      return { lines: [`${name}: command not found. Напиши help.`] };
  }
}
