import type { EventPayload } from '../../../core/scenario/types';

export type WorkspaceEntryKind = 'directory' | 'file';

export interface WorkspaceEntry {
  path: string;
  name: string;
  kind: WorkspaceEntryKind;
  content?: string;
  artifactId?: string;
  mode: string;
  owner: string;
  modified: string;
}

export interface WorkspaceEnvironment {
  seed: number;
  entries: Record<string, WorkspaceEntry>;
  children: Record<string, string[]>;
  transfer: {
    caseCode: string;
    directory: string;
    fileName: string;
    path: string;
  };
}

export interface WorkspaceCommandResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
  cwd: string;
  clear?: boolean;
  openedArtifactId?: string;
  payload: EventPayload;
}

const HOME = '/home/ilya';

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
  entries: Record<string, WorkspaceEntry>,
  children: Record<string, string[]>,
  entry: WorkspaceEntry,
) {
  entries[entry.path] = entry;
  if (entry.path === '/') return;
  const parent = parentPath(entry.path);
  children[parent] = [...(children[parent] ?? []), entry.path];
  if (entry.kind === 'directory') children[entry.path] = children[entry.path] ?? [];
}

export function normalizeWorkspacePath(cwd: string, raw: string | undefined): string {
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

export function createWorkspaceEnvironment(seed: number): WorkspaceEnvironment {
  const random = mulberry32(seed);
  const caseCode = `FS-${String(Math.floor(random() * 900) + 100)}`;
  const directoryName = pick(random, ['packet-a', 'handoff-2', 'local-copy', 'night-drop']);
  const fileName = pick(random, ['handoff.txt', 'source-note.txt', 'manifest.txt', 'case-index.txt']);
  const transferDirectory = `${HOME}/incoming/${directoryName}`;
  const transferPath = `${transferDirectory}/${fileName}`;

  const entries: Record<string, WorkspaceEntry> = {};
  const children: Record<string, string[]> = {};
  const dir = (path: string) => addEntry(entries, children, {
    path,
    name: baseName(path),
    kind: 'directory',
    mode: 'drwxr-xr-x',
    owner: 'ilya:users',
    modified: '2026-03-14 21:20',
  });
  const file = (path: string, content: string, artifactId?: string, mode = '-rw-r--r--') => addEntry(entries, children, {
    path,
    name: baseName(path),
    kind: 'file',
    content,
    artifactId,
    mode,
    owner: 'ilya:users',
    modified: '2026-03-14 21:20',
  });

  dir('/');
  dir('/home');
  dir(HOME);
  dir(`${HOME}/cases`);
  dir(`${HOME}/cases/clinic-01`);
  dir(`${HOME}/incoming`);
  dir(transferDirectory);
  dir(`${HOME}/incoming/old-copy`);
  dir(`${HOME}/notes`);

  file(`${HOME}/README.txt`, [
    'FALSE ACCESS / LOCAL WORKSPACE',
    '',
    'Рабочие материалы лежат в каталогах cases и incoming.',
    'Перед чтением файла проверь текущий путь и содержимое каталога.',
    'Исходные данные не изменяй.',
  ].join('\n'), 'artifact.workspace.readme');

  file(`${HOME}/cases/clinic-01/brief.txt`, [
    'CLINIC-01 / ПЕРЕДАЧА МАТЕРИАЛОВ',
    '',
    'Источник: Максим Белов, системный администратор клиники №4.',
    'Среда: локальная очищенная копия. Внешняя сеть отключена.',
    '',
    'Сейчас задача одна: научиться уверенно находить материалы.',
    `После чтения этого файла найди пакет ${caseCode} в каталоге incoming.`,
    'В пакете нужен текстовый индекс. Имя вложенного каталога заранее не сообщается.',
    '',
    'Не удаляй и не перемещай исходные файлы.',
  ].join('\n'), 'artifact.workspace.brief');

  file(`${HOME}/cases/clinic-01/auth.log`, 'Материал закрыт до главы 0.2. Сейчас его анализировать не требуется.');
  file(`${HOME}/incoming/old-copy/readme.txt`, 'Архив старого теста. Код пакета: FS-000.');
  file(`${HOME}/incoming/old-copy/checksum.sha256`, 'archived-placeholder  readme.txt');
  file(`${transferDirectory}/noise.log`, 'INFO local copy ready\nINFO no external network\nINFO package indexed');
  file(transferPath, [
    `PACKAGE=${caseCode}`,
    'SOURCE=local-sanitized-copy',
    'OWNER=Maxim Belov',
    'NEXT=Inspect CLINIC-01 logs in chapter 0.2',
    'INTEGRITY=training-copy',
  ].join('\n'), 'artifact.workspace.transfer');
  file(`${HOME}/notes/todo.txt`, '1. Проверить текущую папку.\n2. Читать постановку до данных.');

  for (const paths of Object.values(children)) {
    paths.sort((left, right) => entries[left].name.localeCompare(entries[right].name));
  }

  return {
    seed,
    entries,
    children,
    transfer: {
      caseCode,
      directory: transferDirectory,
      fileName,
      path: transferPath,
    },
  };
}

function commandParts(raw: string): string[] {
  return raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^("|')|("|')$/g, '')) ?? [];
}

function result(
  raw: string,
  cwd: string,
  nextCwd: string,
  stdout: string[],
  stderr: string[],
  exitCode: number,
  extra: Partial<WorkspaceCommandResult> & { payload?: EventPayload } = {},
): WorkspaceCommandResult {
  const [name = '', ...args] = commandParts(raw.trim());
  const payload: EventPayload = {
    command: raw.trim(),
    name,
    args,
    cwd,
    nextCwd,
    success: exitCode === 0,
    exitCode,
    readOnly: true,
    destructive: false,
    externalNetwork: false,
    stdout,
    stderr,
    ...(extra.payload ?? {}),
  };
  return {
    stdout,
    stderr,
    exitCode,
    cwd: nextCwd,
    clear: extra.clear,
    openedArtifactId: extra.openedArtifactId,
    payload,
  };
}

function listLine(entry: WorkspaceEntry): string {
  const size = entry.kind === 'directory' ? 4096 : (entry.content?.length ?? 0);
  return `${entry.mode} 1 ${entry.owner.padEnd(12, ' ')} ${String(size).padStart(5, ' ')} ${entry.modified} ${entry.name}`;
}

export function runWorkspaceCommand(
  environment: WorkspaceEnvironment,
  cwd: string,
  raw: string,
): WorkspaceCommandResult {
  const trimmed = raw.trim();
  if (!trimmed) return result(raw, cwd, cwd, [], [], 0);
  const [name = '', ...args] = commandParts(trimmed);
  const lower = name.toLowerCase();
  const destructive = new Set(['rm', 'mv', 'chmod', 'chown', 'truncate', 'rmdir', 'touch']);
  const external = new Set(['curl', 'wget', 'ssh', 'scp', 'nc', 'ncat', 'ping', 'telnet']);

  if (destructive.has(lower) || /(^|\s)>(>|\s|$)/.test(trimmed) || /\bsed\s+-i\b/i.test(trimmed)) {
    return result(raw, cwd, cwd, [], ['Операция заблокирована: исходная учебная копия работает только в read-only режиме.'], 126, {
      payload: { destructive: true, readOnly: false },
    });
  }
  if (external.has(lower)) {
    return result(raw, cwd, cwd, [], ['Внешняя сеть отключена. Используй только локальные артефакты миссии.'], 126, {
      payload: { externalNetwork: true },
    });
  }

  switch (lower) {
    case 'help':
      return result(raw, cwd, cwd, [
        'pwd                 текущий каталог',
        'ls [-la] [path]     содержимое каталога',
        'cd <path>           перейти в каталог',
        'cat <file>          прочитать текстовый файл',
        'file <path>         определить тип объекта',
        'stat <path>         показать metadata',
        'clear               очистить вывод',
      ], [], 0);
    case 'clear':
      return result(raw, cwd, cwd, [], [], 0, { clear: true });
    case 'pwd':
      return result(raw, cwd, cwd, [cwd], [], 0, { payload: { concept: 'current-directory' } });
    case 'ls': {
      const detailed = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const pathArg = args.find((arg) => !arg.startsWith('-'));
      const target = normalizeWorkspacePath(cwd, pathArg);
      const entry = environment.entries[target];
      if (!entry) return result(raw, cwd, cwd, [], [`ls: cannot access '${pathArg ?? target}': No such file or directory`], 2, { payload: { targetPath: target } });
      if (entry.kind !== 'directory') return result(raw, cwd, cwd, [detailed ? listLine(entry) : entry.name], [], 0, { payload: { targetPath: target, targetKind: entry.kind } });
      const values = (environment.children[target] ?? []).map((path) => environment.entries[path]);
      return result(raw, cwd, cwd, detailed ? values.map(listLine) : [values.map((item) => item.name).join('  ')], [], 0, {
        payload: { targetPath: target, targetKind: 'directory', entryCount: values.length },
      });
    }
    case 'cd': {
      const requested = args[0] ?? '~';
      const target = normalizeWorkspacePath(cwd, requested);
      const entry = environment.entries[target];
      const pathMode = requested.startsWith('/') ? 'absolute' : 'relative';
      if (!entry) return result(raw, cwd, cwd, [], [`bash: cd: ${requested}: No such file or directory`], 1, { payload: { targetPath: target, pathMode } });
      if (entry.kind !== 'directory') return result(raw, cwd, cwd, [], [`bash: cd: ${requested}: Not a directory`], 1, { payload: { targetPath: target, pathMode } });
      return result(raw, cwd, target, [], [], 0, {
        payload: {
          targetPath: target,
          targetKind: 'directory',
          pathMode,
          guidedDestination: target === `${HOME}/cases/clinic-01`,
          transferDestination: target === environment.transfer.directory,
        },
      });
    }
    case 'cat':
    case 'file':
    case 'stat': {
      const requested = args[0];
      if (!requested) return result(raw, cwd, cwd, [], [`${lower}: missing operand`], 1);
      const target = normalizeWorkspacePath(cwd, requested);
      const entry = environment.entries[target];
      const pathMode = requested.startsWith('/') ? 'absolute' : 'relative';
      if (!entry) return result(raw, cwd, cwd, [], [`${lower}: ${requested}: No such file or directory`], 1, { payload: { targetPath: target, pathMode } });
      if (lower === 'cat' && entry.kind === 'directory') return result(raw, cwd, cwd, [], [`cat: ${requested}: Is a directory`], 1, { payload: { targetPath: target, targetKind: 'directory', pathMode } });
      const stdout = lower === 'cat'
        ? (entry.content ?? '').split('\n')
        : lower === 'file'
          ? [`${requested}: ${entry.kind === 'directory' ? 'directory' : 'UTF-8 Unicode text'}`]
          : [
              `  File: ${entry.path}`,
              `  Type: ${entry.kind}`,
              `  Mode: ${entry.mode}`,
              ` Owner: ${entry.owner}`,
              `Modify: ${entry.modified}`,
            ];
      return result(raw, cwd, cwd, stdout, [], 0, {
        openedArtifactId: lower === 'cat' ? entry.artifactId : undefined,
        payload: {
          targetPath: target,
          targetKind: entry.kind,
          targetArtifactId: entry.artifactId ?? null,
          pathMode,
          independent: target === environment.transfer.path,
        },
      });
    }
    default:
      return result(raw, cwd, cwd, [], [`${name}: command not found`, 'Напиши help, чтобы увидеть доступные локальные команды.'], 127);
  }
}

export const WORKSPACE_HOME = HOME;
