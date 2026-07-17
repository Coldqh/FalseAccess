import type { EventPayload } from '../../../core/scenario/types';

export type LogsEntryKind = 'directory' | 'file';

export interface LogsEntry {
  path: string;
  name: string;
  kind: LogsEntryKind;
  content?: string;
  artifactId?: string;
  writable: boolean;
  mode: string;
  owner: string;
  modified: string;
}

export interface LogsEnvironment {
  seed: number;
  entries: Record<string, LogsEntry>;
  children: Record<string, string[]>;
  facts: {
    guidedSource: string;
    guidedFailureCount: number;
    localEventTime: string;
    normalizedEventTime: string;
    transferSource: string;
    transferFailureCount: number;
    transferFile: string;
  };
}

export interface LogsCommandResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
  cwd: string;
  clear?: boolean;
  openedArtifactIds: string[];
  payload: EventPayload;
}

interface PipelineParse {
  stages: string[];
  redirect: { mode: 'write' | 'append'; target: string } | null;
  error: string | null;
}

interface StageResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
  nextCwd?: string;
  openedArtifactIds?: string[];
  tool: string;
}

const HOME = '/home/ilya';
export const LOGS_HOME = `${HOME}/cases/clinic-01`;
const WORK = `${HOME}/work`;

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)];
}

function parentPath(path: string): string {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join('/')}` : '/';
}

function baseName(path: string): string {
  return path === '/' ? '/' : path.split('/').filter(Boolean).at(-1) ?? '/';
}

function addEntry(
  entries: Record<string, LogsEntry>,
  children: Record<string, string[]>,
  entry: LogsEntry,
) {
  entries[entry.path] = entry;
  if (entry.path === '/') return;
  const parent = parentPath(entry.path);
  children[parent] = [...(children[parent] ?? []), entry.path];
  if (entry.kind === 'directory') children[entry.path] = children[entry.path] ?? [];
}

export function normalizeLogsPath(cwd: string, raw: string | undefined): string {
  if (!raw || raw === '~') return HOME;
  const expanded = raw.startsWith('~/') ? `${HOME}/${raw.slice(2)}` : raw;
  const source = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`;
  const stack: string[] = [];
  for (const part of source.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}` || '/';
}

function isoAt(baseSeconds: number, offsetSeconds: number) {
  return new Date((baseSeconds + offsetSeconds) * 1000).toISOString();
}

export function createLogsEnvironment(seed: number): LogsEnvironment {
  const random = mulberry32(seed);
  const guidedSource = '185.44.17.92';
  const guidedFailureCount = 6;
  const transferSource = `${pick(random, [45, 62, 77, 91, 103, 185])}.${Math.floor(random() * 180) + 20}.${Math.floor(random() * 220) + 10}.${Math.floor(random() * 220) + 10}`;
  const transferFailureCount = Math.floor(random() * 4) + 6;
  const transferFileName = pick(random, ['events.jsonl', 'auth-stream.jsonl', 'session-events.jsonl']);
  const transferFile = `${LOGS_HOME}/transfer/${transferFileName}`;
  const localEventTime = '2026-03-14 21:12:20 +0300';
  const normalizedEventTime = '2026-03-14T18:12:20.000Z';

  const entries: Record<string, LogsEntry> = {};
  const children: Record<string, string[]> = {};
  const dir = (path: string, writable = false) => addEntry(entries, children, {
    path,
    name: baseName(path),
    kind: 'directory',
    writable,
    mode: writable ? 'drwxrwxr-x' : 'dr-xr-xr-x',
    owner: 'ilya:users',
    modified: '2026-03-14 21:24',
  });
  const file = (path: string, content: string, artifactId?: string, writable = false) => addEntry(entries, children, {
    path,
    name: baseName(path),
    kind: 'file',
    content,
    artifactId,
    writable,
    mode: writable ? '-rw-rw-r--' : '-r--r--r--',
    owner: 'ilya:users',
    modified: '2026-03-14 21:24',
  });

  dir('/');
  dir('/home');
  dir(HOME);
  dir(`${HOME}/cases`);
  dir(LOGS_HOME);
  dir(`${LOGS_HOME}/logs`);
  dir(`${LOGS_HOME}/archive`);
  dir(`${LOGS_HOME}/transfer`);
  dir(WORK, true);

  file(`${LOGS_HOME}/brief.txt`, [
    'ГЛАВА 0.2 / SHELL, ЛОГИ И ВРЕМЯ',
    '',
    'Источник: локальная очищенная копия CLINIC-01.',
    'Часовой пояс clinic-ws: UTC+03:00.',
    '',
    'Задачи:',
    '1. Выделить Failed password в logs/auth.log и определить источник.',
    '2. Получить воспроизводимый счётчик отказов.',
    `3. Нормализовать время ${localEventTime} в UTC и сопоставить с logs/proxy.csv.`,
    '4. Сохранить производный результат только в /home/ilya/work.',
    '5. Самостоятельно разобрать transfer/*.jsonl. Внутри есть повреждённая строка.',
    '',
    'Не изменяй исходные файлы и не обращайся к внешней сети.',
  ].join('\n'), 'artifact.logs.brief');

  file(`${LOGS_HOME}/formats.txt`, [
    'auth.log: whitespace-separated syslog-like text. Время узла — UTC+03:00.',
    'proxy.csv: timestamp_utc,src,dst,status,bytes.',
    'transfer/*.jsonl: один JSON-объект на строку. Повреждённая строка не является событием.',
    'stdout — обычный результат. stderr — ошибка. exit code 0 означает успешное выполнение команды.',
  ].join('\n'), 'artifact.logs.formats');

  const authLines = [
    'Mar 14 21:08:11 clinic-ws sshd[1092]: Accepted password for nurse from 10.14.2.18 port 55192 ssh2',
    'Mar 14 21:11:42 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2',
    'Mar 14 21:11:44 clinic-ws sshd[1188]: Failed password for invalid user admin from 185.44.17.92 port 43110 ssh2',
    'Mar 14 21:11:47 clinic-ws sshd[1188]: Failed password for root from 185.44.17.92 port 43110 ssh2',
    'Mar 14 21:12:02 clinic-ws sshd[1195]: Failed password for invalid user postgres from 185.44.17.92 port 43188 ssh2',
    'Mar 14 21:12:16 clinic-ws sshd[1201]: Failed password for invalid user oracle from 185.44.17.92 port 43212 ssh2',
    'Mar 14 21:12:20 clinic-ws sshd[1201]: Failed password for root from 185.44.17.92 port 43212 ssh2',
    'Mar 14 21:17:08 clinic-ws sshd[1280]: Accepted publickey for backup from 10.14.2.5 port 49818 ssh2',
  ];
  file(`${LOGS_HOME}/logs/auth.log`, authLines.join('\n'), 'artifact.logs.auth');

  file(`${LOGS_HOME}/logs/proxy.csv`, [
    'timestamp_utc,src,dst,status,bytes',
    '2026-03-14T18:08:12Z,10.14.2.18,updates.clinic.local,200,812',
    '2026-03-14T18:12:31Z,10.14.2.18,telemetry.vendor.test,204,96',
    '2026-03-14T18:17:09Z,10.14.2.5,backup.clinic.local,200,1892',
  ].join('\n'), 'artifact.logs.proxy');

  file(`${LOGS_HOME}/archive/auth-previous.log`, [
    'Mar 13 21:12:20 clinic-ws sshd[991]: Failed password for guest from 203.0.113.44 port 41200 ssh2',
    'ARCHIVE_DATE=2026-03-13',
  ].join('\n'));

  const base = Date.parse('2026-03-15T00:30:00Z') / 1000;
  const transferEvents: string[] = [
    JSON.stringify({ time: isoAt(base, 0), host: 'desk-04', user: 'backup', src: '10.14.2.5', status: 'success' }),
    JSON.stringify({ time: isoAt(base, 14), host: 'desk-04', user: 'nurse', src: '10.14.2.18', status: 'success' }),
  ];
  for (let index = 0; index < transferFailureCount; index += 1) {
    transferEvents.push(JSON.stringify({
      time: isoAt(base, 30 + index * 7),
      host: 'desk-04',
      user: ['admin', 'root', 'service'][index % 3],
      src: transferSource,
      status: 'failed',
    }));
  }
  transferEvents.splice(Math.min(3, transferEvents.length), 0, 'BROKEN-LINE: incomplete collector write');
  transferEvents.push(JSON.stringify({ time: isoAt(base, 180), host: 'desk-04', user: 'operator', src: '10.14.2.27', status: 'success' }));
  file(transferFile, transferEvents.join('\n'), 'artifact.logs.transfer');

  for (const paths of Object.values(children)) {
    paths.sort((left, right) => entries[left].name.localeCompare(entries[right].name));
  }

  return {
    seed,
    entries,
    children,
    facts: {
      guidedSource,
      guidedFailureCount,
      localEventTime,
      normalizedEventTime,
      transferSource,
      transferFailureCount,
      transferFile,
    },
  };
}

function splitShell(raw: string): PipelineParse {
  const stages: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let redirect: PipelineParse['redirect'] = null;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if ((char === '"' || char === "'") && raw[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
      current += char;
      continue;
    }
    if (!quote && char === '|') {
      if (!current.trim()) return { stages: [], redirect: null, error: 'syntax error near unexpected token `|`' };
      stages.push(current.trim());
      current = '';
      continue;
    }
    if (!quote && char === '>') {
      const mode = raw[index + 1] === '>' ? 'append' : 'write';
      if (mode === 'append') index += 1;
      const target = raw.slice(index + 1).trim();
      if (!target) return { stages: [], redirect: null, error: 'syntax error: missing redirection target' };
      redirect = { mode, target };
      break;
    }
    current += char;
  }

  if (quote) return { stages: [], redirect: null, error: 'syntax error: unclosed quote' };
  if (current.trim()) stages.push(current.trim());
  if (!stages.length) return { stages: [], redirect: null, error: null };
  return { stages, redirect, error: null };
}

function commandParts(raw: string): string[] {
  return raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^("|')|("|')$/g, '')) ?? [];
}

function wildcardToRegex(pattern: string) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*').replaceAll('?', '.');
  return new RegExp(`^${escaped}$`, 'i');
}

function listLine(entry: LogsEntry): string {
  const size = entry.kind === 'directory' ? 4096 : (entry.content?.length ?? 0);
  return `${entry.mode} 1 ${entry.owner.padEnd(12, ' ')} ${String(size).padStart(5, ' ')} ${entry.modified} ${entry.name}`;
}

function readSource(environment: LogsEnvironment, cwd: string, fileName: string | undefined, stdin: string[] | null) {
  if (!fileName) return stdin === null
    ? { lines: [] as string[], stderr: ['missing operand'], exitCode: 1, artifactIds: [] as string[] }
    : { lines: stdin, stderr: [] as string[], exitCode: 0, artifactIds: [] as string[] };
  const target = normalizeLogsPath(cwd, fileName);
  const entry = environment.entries[target];
  if (!entry) return { lines: [] as string[], stderr: [`${fileName}: No such file or directory`], exitCode: 1, artifactIds: [] as string[] };
  if (entry.kind !== 'file') return { lines: [] as string[], stderr: [`${fileName}: Is a directory`], exitCode: 1, artifactIds: [] as string[] };
  return {
    lines: (entry.content ?? '').split('\n'),
    stderr: [] as string[],
    exitCode: 0,
    artifactIds: entry.artifactId ? [entry.artifactId] : [] as string[],
  };
}

function executeStage(
  environment: LogsEnvironment,
  cwd: string,
  raw: string,
  stdin: string[] | null,
): StageResult {
  const [name = '', ...args] = commandParts(raw);
  const tool = name.toLowerCase();

  if (tool === 'help') return {
    tool,
    stdout: [
      'pwd                                  текущий каталог',
      'ls [-la] [path]                      список объектов',
      'cd <path>                            сменить каталог',
      'cat/head/tail <file>                 прочитать данные',
      'grep [-i|-v|-c] <pattern> [file]     фильтровать строки',
      'wc -l [file]                         посчитать строки',
      'cut -d <sep> -f <n> [file]           выбрать поле',
      'sort [file] | uniq [-c]              сортировать и группировать',
      'find [path] -type f -name <pattern>   найти файл',
      'jq -r <expr> [file]                  разобрать JSONL',
      'date -u -d <time>                    нормализовать время в UTC',
      'command | command                    передать stdout дальше',
      'command > /home/ilya/work/file       сохранить производный результат',
    ],
    stderr: [], exitCode: 0,
  };
  if (tool === 'pwd') return { tool, stdout: [cwd], stderr: [], exitCode: 0 };
  if (tool === 'clear') return { tool, stdout: [], stderr: [], exitCode: 0 };

  if (tool === 'ls') {
    const detailed = args.some((arg) => ['-l', '-la', '-al'].includes(arg));
    const pathArg = args.find((arg) => !arg.startsWith('-'));
    const target = normalizeLogsPath(cwd, pathArg);
    const entry = environment.entries[target];
    if (!entry) return { tool, stdout: [], stderr: [`ls: cannot access '${pathArg ?? target}': No such file or directory`], exitCode: 2 };
    if (entry.kind === 'file') return { tool, stdout: [detailed ? listLine(entry) : entry.name], stderr: [], exitCode: 0, openedArtifactIds: entry.artifactId ? [entry.artifactId] : [] };
    const values = (environment.children[target] ?? []).map((path) => environment.entries[path]);
    return { tool, stdout: detailed ? values.map(listLine) : [values.map((item) => item.name).join('  ')], stderr: [], exitCode: 0 };
  }

  if (tool === 'cd') {
    const target = normalizeLogsPath(cwd, args[0] ?? '~');
    const entry = environment.entries[target];
    if (!entry) return { tool, stdout: [], stderr: [`bash: cd: ${args[0] ?? '~'}: No such file or directory`], exitCode: 1 };
    if (entry.kind !== 'directory') return { tool, stdout: [], stderr: [`bash: cd: ${args[0]}: Not a directory`], exitCode: 1 };
    return { tool, stdout: [], stderr: [], exitCode: 0, nextCwd: target };
  }

  if (tool === 'cat') {
    const source = readSource(environment, cwd, args[0], stdin);
    return { tool, stdout: source.lines, stderr: source.stderr, exitCode: source.exitCode, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'head' || tool === 'tail') {
    let count = 5;
    let fileName: string | undefined;
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === '-n' && Number.isFinite(Number(args[index + 1]))) {
        count = Math.max(0, Number(args[index + 1]));
        index += 1;
      } else fileName = args[index];
    }
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    return { tool, stdout: tool === 'head' ? source.lines.slice(0, count) : source.lines.slice(-count), stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'grep') {
    let insensitive = false;
    let invert = false;
    let countOnly = false;
    const positionals: string[] = [];
    for (const arg of args) {
      if (arg.startsWith('-') && arg.length > 1) {
        insensitive ||= arg.includes('i');
        invert ||= arg.includes('v');
        countOnly ||= arg.includes('c');
      } else positionals.push(arg);
    }
    const pattern = positionals[0];
    const fileName = positionals[1];
    if (!pattern) return { tool, stdout: [], stderr: ['grep: missing pattern'], exitCode: 2 };
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    let expression: RegExp;
    try { expression = new RegExp(pattern, insensitive ? 'i' : ''); }
    catch { expression = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'i' : ''); }
    const matches = source.lines.filter((line) => invert ? !expression.test(line) : expression.test(line));
    return { tool, stdout: countOnly ? [String(matches.length)] : matches, stderr: [], exitCode: matches.length ? 0 : 1, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'wc') {
    if (args[0] !== '-l') return { tool, stdout: [], stderr: ['wc: supported usage: wc -l [file]'], exitCode: 2 };
    const source = readSource(environment, cwd, args[1], stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    return { tool, stdout: [String(source.lines.length)], stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'sort') {
    const fileName = args.find((arg) => !arg.startsWith('-'));
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    return { tool, stdout: [...source.lines].sort((left, right) => left.localeCompare(right)), stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'uniq') {
    const countOnly = args.includes('-c');
    const fileName = args.find((arg) => !arg.startsWith('-'));
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    const groups: Array<{ value: string; count: number }> = [];
    for (const line of source.lines) {
      const last = groups.at(-1);
      if (last?.value === line) last.count += 1;
      else groups.push({ value: line, count: 1 });
    }
    return { tool, stdout: groups.map((group) => countOnly ? `${String(group.count).padStart(4, ' ')} ${group.value}` : group.value), stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'cut') {
    const delimiterIndex = args.indexOf('-d');
    const fieldIndex = args.indexOf('-f');
    const delimiter = delimiterIndex >= 0 ? args[delimiterIndex + 1] : undefined;
    const field = fieldIndex >= 0 ? Number(args[fieldIndex + 1]) : NaN;
    const consumed = new Set([delimiterIndex, delimiterIndex + 1, fieldIndex, fieldIndex + 1]);
    const fileName = args.find((arg, index) => !consumed.has(index) && !arg.startsWith('-'));
    if (delimiter === undefined || !Number.isInteger(field) || field < 1) return { tool, stdout: [], stderr: ['cut: supported usage: cut -d <delimiter> -f <field> [file]'], exitCode: 2 };
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    return { tool, stdout: source.lines.map((line) => line.split(delimiter)[field - 1] ?? ''), stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'find') {
    const pathArg = args.find((arg) => !arg.startsWith('-')) ?? '.';
    const nameIndex = args.indexOf('-name');
    const namePattern = nameIndex >= 0 ? args[nameIndex + 1] : '*';
    const filesOnly = args.includes('-type') && args[args.indexOf('-type') + 1] === 'f';
    const target = normalizeLogsPath(cwd, pathArg);
    if (!environment.entries[target]) return { tool, stdout: [], stderr: [`find: '${pathArg}': No such file or directory`], exitCode: 1 };
    const regex = wildcardToRegex(namePattern);
    const matches = Object.values(environment.entries)
      .filter((entry) => (entry.path === target || entry.path.startsWith(`${target}/`)))
      .filter((entry) => !filesOnly || entry.kind === 'file')
      .filter((entry) => regex.test(entry.name))
      .map((entry) => entry.path)
      .sort();
    return { tool, stdout: matches, stderr: [], exitCode: 0 };
  }

  if (tool === 'jq') {
    const rawMode = args.includes('-r');
    const positionals = args.filter((arg) => arg !== '-r');
    const expression = positionals[0];
    const fileName = positionals[1];
    if (!expression) return { tool, stdout: [], stderr: ['jq: missing filter'], exitCode: 2 };
    const source = readSource(environment, cwd, fileName, stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    const select = expression.match(/^select\(\.([a-zA-Z0-9_]+)\s*==\s*["']([^"']+)["']\)\s*\|\s*\.([a-zA-Z0-9_]+)$/);
    const field = expression.match(/^\.([a-zA-Z0-9_]+)$/);
    const output: string[] = [];
    for (let index = 0; index < source.lines.length; index += 1) {
      const line = source.lines[index];
      try {
        const value = JSON.parse(line) as Record<string, unknown>;
        let resultValue: unknown;
        if (select) {
          if (String(value[select[1]]) !== select[2]) continue;
          resultValue = value[select[3]];
        } else if (field) resultValue = value[field[1]];
        else return { tool, stdout: [], stderr: ['jq: this lab supports .field or select(.field=="value") | .field'], exitCode: 3 };
        output.push(rawMode ? String(resultValue ?? '') : JSON.stringify(resultValue));
      } catch {
        return { tool, stdout: [], stderr: [`jq: parse error at input line ${index + 1}`], exitCode: 4, openedArtifactIds: source.artifactIds };
      }
    }
    return { tool, stdout: output, stderr: [], exitCode: 0, openedArtifactIds: source.artifactIds };
  }

  if (tool === 'date') {
    const utc = args.includes('-u');
    const dIndex = args.indexOf('-d');
    const input = dIndex >= 0 ? args[dIndex + 1] : undefined;
    if (!utc || !input) return { tool, stdout: [], stderr: ['date: supported usage: date -u -d "YYYY-MM-DD HH:mm:ss +ZZZZ"'], exitCode: 2 };
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return { tool, stdout: [], stderr: [`date: invalid date '${input}'`], exitCode: 1 };
    return { tool, stdout: [parsed.toISOString()], stderr: [], exitCode: 0 };
  }

  if (tool === 'file') {
    const target = normalizeLogsPath(cwd, args[0]);
    const entry = environment.entries[target];
    if (!entry) return { tool, stdout: [], stderr: [`file: cannot open '${args[0] ?? ''}'`], exitCode: 1 };
    const kind = entry.kind === 'directory' ? 'directory'
      : entry.name.endsWith('.csv') ? 'CSV text'
        : entry.name.endsWith('.jsonl') ? 'JSON Lines text'
          : entry.name.endsWith('.log') ? 'UTF-8 text log'
            : 'UTF-8 text';
    return { tool, stdout: [`${args[0]}: ${kind}`], stderr: [], exitCode: 0, openedArtifactIds: entry.artifactId ? [entry.artifactId] : [] };
  }

  return { tool, stdout: [], stderr: [`${name}: command not found`], exitCode: 127 };
}

function inferFinding(environment: LogsEnvironment, raw: string, stdout: string[], tools: string[]) {
  const text = stdout.join('\n');
  const referencesAuth = /auth\.log/i.test(raw);
  const referencesTransfer = /\.jsonl/i.test(raw);
  if (referencesTransfer
    && text.includes(environment.facts.transferSource)
    && text.includes(String(environment.facts.transferFailureCount))) return 'transfer-source-count';
  if (referencesAuth
    && text.trim() === String(environment.facts.guidedFailureCount)
    && tools.some((tool) => tool === 'grep')
    && tools.some((tool) => tool === 'wc' || tool === 'grep')) return 'guided-failure-count';
  if (referencesAuth && text.includes(environment.facts.guidedSource)) return 'guided-source';
  if (tools.includes('date') && text.includes(environment.facts.normalizedEventTime)) return 'normalized-time';
  return '';
}

export function runLogsCommand(
  environment: LogsEnvironment,
  cwd: string,
  raw: string,
): LogsCommandResult {
  const trimmed = raw.trim();
  if (!trimmed) return {
    stdout: [], stderr: [], exitCode: 0, cwd, openedArtifactIds: [],
    payload: { command: '', name: '', cwd, nextCwd: cwd, success: true, exitCode: 0 },
  };

  const firstName = commandParts(trimmed)[0]?.toLowerCase() ?? '';
  const destructive = new Set(['rm', 'mv', 'chmod', 'chown', 'truncate', 'rmdir', 'touch', 'sed']);
  const external = new Set(['curl', 'wget', 'ssh', 'scp', 'nc', 'ncat', 'ping', 'telnet']);
  if (destructive.has(firstName)) {
    const stderr = ['Операция заблокирована: исходные материалы read-only. Производные файлы создаются только через > в /home/ilya/work.'];
    return {
      stdout: [], stderr, exitCode: 126, cwd, openedArtifactIds: [],
      payload: { command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr, success: false, exitCode: 126, destructive: true, externalNetwork: false },
    };
  }
  if (external.has(firstName)) {
    const stderr = ['Внешняя сеть отключена. Анализируй только локальные синтетические данные.'];
    return {
      stdout: [], stderr, exitCode: 126, cwd, openedArtifactIds: [],
      payload: { command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr, success: false, exitCode: 126, destructive: false, externalNetwork: true },
    };
  }

  const parsed = splitShell(trimmed);
  if (parsed.error) {
    return {
      stdout: [], stderr: [parsed.error], exitCode: 2, cwd, openedArtifactIds: [],
      payload: { command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr: [parsed.error], success: false, exitCode: 2, destructive: false, externalNetwork: false },
    };
  }

  const stageTools = parsed.stages.map((stage) => commandParts(stage)[0]?.toLowerCase() ?? '');
  const destructiveStage = stageTools.find((tool) => destructive.has(tool));
  if (destructiveStage) {
    const stderr = [`Операция ${destructiveStage} заблокирована: исходные материалы read-only.`];
    return {
      stdout: [], stderr, exitCode: 126, cwd, openedArtifactIds: [],
      payload: { command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr, success: false, exitCode: 126, destructive: true, externalNetwork: false },
    };
  }
  const externalStage = stageTools.find((tool) => external.has(tool));
  if (externalStage) {
    const stderr = [`Команда ${externalStage} заблокирована: внешняя сеть отключена.`];
    return {
      stdout: [], stderr, exitCode: 126, cwd, openedArtifactIds: [],
      payload: { command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr, success: false, exitCode: 126, destructive: false, externalNetwork: true },
    };
  }

  if (parsed.redirect) {
    const target = normalizeLogsPath(cwd, parsed.redirect.target);
    if (!(target === WORK || target.startsWith(`${WORK}/`))) {
      const stderr = [`bash: ${parsed.redirect.target}: Read-only source path`];
      return {
        stdout: [], stderr, exitCode: 126, cwd, openedArtifactIds: [],
        payload: {
          command: trimmed, name: firstName, cwd, nextCwd: cwd, stdout: [], stderr,
          success: false, exitCode: 126, destructive: true, externalNetwork: false,
          redirectedTo: target, derivedWrite: false,
        },
      };
    }
  }

  let stdin: string[] | null = null;
  let nextCwd = cwd;
  let stdout: string[] = [];
  let stderr: string[] = [];
  let exitCode = 0;
  const tools: string[] = [];
  const openedArtifactIds = new Set<string>();

  for (const stage of parsed.stages) {
    const stageResult = executeStage(environment, nextCwd, stage, stdin);
    tools.push(stageResult.tool);
    stageResult.openedArtifactIds?.forEach((id) => openedArtifactIds.add(id));
    stdout = stageResult.stdout;
    stderr = stageResult.stderr;
    exitCode = stageResult.exitCode;
    if (stageResult.nextCwd) nextCwd = stageResult.nextCwd;
    if (exitCode !== 0) break;
    stdin = stdout;
  }

  let redirectedTo = '';
  let derivedWrite = false;
  let destructiveWrite = false;
  if (exitCode === 0 && parsed.redirect) {
    const target = normalizeLogsPath(nextCwd, parsed.redirect.target);
    redirectedTo = target;
    if (!(target === WORK || target.startsWith(`${WORK}/`))) {
      stderr = [`bash: ${parsed.redirect.target}: Read-only source path`];
      stdout = [];
      exitCode = 126;
      destructiveWrite = true;
    } else if (target === WORK) {
      stderr = [`bash: ${parsed.redirect.target}: Is a directory`];
      stdout = [];
      exitCode = 1;
    } else {
      const previous = environment.entries[target]?.content ?? '';
      const nextContent = parsed.redirect.mode === 'append' && previous
        ? `${previous}\n${stdout.join('\n')}`
        : stdout.join('\n');
      if (!environment.entries[target]) {
        addEntry(environment.entries, environment.children, {
          path: target,
          name: baseName(target),
          kind: 'file',
          content: nextContent,
          writable: true,
          mode: '-rw-rw-r--',
          owner: 'ilya:users',
          modified: '2026-03-14 21:25',
        });
      } else environment.entries[target] = { ...environment.entries[target], content: nextContent };
      derivedWrite = true;
      stdout = [];
    }
  }

  const finding = inferFinding(environment, trimmed, stdout, tools);
  const payload: EventPayload = {
    command: trimmed,
    name: tools[0] ?? firstName,
    tools,
    cwd,
    nextCwd,
    stdout,
    stderr,
    success: exitCode === 0,
    exitCode,
    usedPipe: parsed.stages.length > 1,
    pipelineLength: parsed.stages.length,
    redirectedTo,
    derivedWrite,
    destructive: destructiveWrite,
    externalNetwork: false,
    targetArtifactIds: [...openedArtifactIds],
    finding,
    transferSource: finding === 'transfer-source-count' ? environment.facts.transferSource : '',
    transferFailureCount: finding === 'transfer-source-count' ? environment.facts.transferFailureCount : 0,
  };

  return {
    stdout,
    stderr,
    exitCode,
    cwd: nextCwd,
    clear: tools.length === 1 && tools[0] === 'clear',
    openedArtifactIds: [...openedArtifactIds],
    payload,
  };
}
