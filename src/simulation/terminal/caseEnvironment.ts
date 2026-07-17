import type { EventPayload } from '../../core/scenario/types';

export interface CaseFile {
  path: string;
  content: string;
  artifactId?: string;
  writable?: boolean;
}

export interface CaseEnvironment {
  seed: number;
  home: string;
  files: Record<string, CaseFile>;
  directories: string[];
  processOutput?: string[];
  networkOutput?: string[];
  facts: Record<string, string | number | boolean>;
  detectFinding?: (input: { raw: string; stdout: string[]; tools: string[] }) => string | undefined;
}

export interface CaseCommandResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
  cwd: string;
  openedArtifactIds: string[];
  payload: EventPayload;
  clear?: boolean;
}

interface StageResult {
  stdout: string[];
  stderr: string[];
  exitCode: number;
  cwd?: string;
  tool: string;
  openedArtifactIds?: string[];
}

export function normalizeCasePath(home: string, cwd: string, raw?: string): string {
  if (!raw || raw === '~') return home;
  const expanded = raw.startsWith('~/') ? `${home}/${raw.slice(2)}` : raw;
  const source = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`;
  const stack: string[] = [];
  for (const part of source.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return `/${stack.join('/')}` || '/';
}

function commandParts(raw: string): string[] {
  return raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map((part) => part.replace(/^("|')|("|')$/g, '')) ?? [];
}

function splitPipeline(raw: string): { stages: string[]; redirect: string | null; error?: string } {
  const stages: string[] = [];
  let current = '';
  let quote: string | null = null;
  let redirect: string | null = null;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if ((char === '"' || char === "'") && raw[index - 1] !== '\\') {
      quote = quote === char ? null : quote ?? char;
      current += char;
      continue;
    }
    if (!quote && char === '|') {
      if (!current.trim()) return { stages: [], redirect: null, error: 'syntax error near |' };
      stages.push(current.trim());
      current = '';
      continue;
    }
    if (!quote && char === '>') {
      redirect = raw.slice(index + (raw[index + 1] === '>' ? 2 : 1)).trim();
      break;
    }
    current += char;
  }
  if (quote) return { stages: [], redirect: null, error: 'syntax error: unclosed quote' };
  if (current.trim()) stages.push(current.trim());
  return { stages, redirect };
}

function childNames(environment: CaseEnvironment, path: string): string[] {
  const prefix = path === '/' ? '/' : `${path}/`;
  const values = new Set<string>();
  for (const directory of environment.directories) {
    if (!directory.startsWith(prefix) || directory === path) continue;
    const rest = directory.slice(prefix.length);
    if (rest && !rest.includes('/')) values.add(rest);
  }
  for (const file of Object.values(environment.files)) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length);
    if (rest && !rest.includes('/')) values.add(rest);
  }
  return [...values].sort();
}

function readFile(environment: CaseEnvironment, cwd: string, raw: string | undefined, stdin: string[] | null) {
  if (!raw) return stdin === null
    ? { stdout: [] as string[], stderr: ['missing operand'], exitCode: 1, artifacts: [] as string[] }
    : { stdout: stdin, stderr: [] as string[], exitCode: 0, artifacts: [] as string[] };
  const path = normalizeCasePath(environment.home, cwd, raw);
  const file = environment.files[path];
  if (!file) return { stdout: [] as string[], stderr: [`${raw}: No such file`], exitCode: 1, artifacts: [] as string[] };
  return { stdout: file.content.split('\n'), stderr: [] as string[], exitCode: 0, artifacts: file.artifactId ? [file.artifactId] : [] as string[] };
}

function executeStage(environment: CaseEnvironment, cwd: string, raw: string, stdin: string[] | null): StageResult {
  const [name = '', ...args] = commandParts(raw);
  const tool = name.toLowerCase();
  if (tool === 'help') return { tool, stdout: [
    'pwd · ls [-la] · cd <path> · cat/head/tail <file>',
    'grep [-i|-v|-c] <pattern> [file] · wc -l [file]',
    'cut -d <sep> -f <n> [file] · sort · uniq [-c] · find',
    'ps -ef · ss -tpn · command | command',
  ], stderr: [], exitCode: 0 };
  if (tool === 'pwd') return { tool, stdout: [cwd], stderr: [], exitCode: 0 };
  if (tool === 'clear') return { tool, stdout: [], stderr: [], exitCode: 0 };
  if (tool === 'ls') {
    const pathArg = args.find((arg) => !arg.startsWith('-'));
    const target = normalizeCasePath(environment.home, cwd, pathArg);
    if (!environment.directories.includes(target)) {
      const file = environment.files[target];
      return file ? { tool, stdout: [target.split('/').at(-1) ?? target], stderr: [], exitCode: 0, openedArtifactIds: file.artifactId ? [file.artifactId] : [] }
        : { tool, stdout: [], stderr: [`ls: cannot access '${pathArg ?? target}'`], exitCode: 2 };
    }
    return { tool, stdout: [childNames(environment, target).join('  ')], stderr: [], exitCode: 0 };
  }
  if (tool === 'cd') {
    const target = normalizeCasePath(environment.home, cwd, args[0]);
    if (!environment.directories.includes(target)) return { tool, stdout: [], stderr: [`cd: ${args[0] ?? ''}: No such directory`], exitCode: 1 };
    return { tool, stdout: [], stderr: [], exitCode: 0, cwd: target };
  }
  if (tool === 'ps') return { tool, stdout: environment.processOutput ?? [], stderr: environment.processOutput ? [] : ['ps: snapshot unavailable'], exitCode: environment.processOutput ? 0 : 1 };
  if (tool === 'ss') return { tool, stdout: environment.networkOutput ?? [], stderr: environment.networkOutput ? [] : ['ss: snapshot unavailable'], exitCode: environment.networkOutput ? 0 : 1 };
  if (tool === 'cat' || tool === 'head' || tool === 'tail') {
    const source = readFile(environment, cwd, args.at(-1), stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    const count = 8;
    const stdout = tool === 'head' ? source.stdout.slice(0, count) : tool === 'tail' ? source.stdout.slice(-count) : source.stdout;
    return { tool, stdout, stderr: [], exitCode: 0, openedArtifactIds: source.artifacts };
  }
  if (tool === 'grep') {
    let insensitive = false; let invert = false; let countOnly = false;
    const positionals: string[] = [];
    for (const arg of args) {
      if (arg.startsWith('-')) { insensitive ||= arg.includes('i'); invert ||= arg.includes('v'); countOnly ||= arg.includes('c'); }
      else positionals.push(arg);
    }
    const pattern = positionals[0];
    if (!pattern) return { tool, stdout: [], stderr: ['grep: missing pattern'], exitCode: 2 };
    const source = readFile(environment, cwd, positionals[1], stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    let regex: RegExp;
    try { regex = new RegExp(pattern, insensitive ? 'i' : ''); } catch { regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'i' : ''); }
    const matches = source.stdout.filter((line) => invert ? !regex.test(line) : regex.test(line));
    return { tool, stdout: countOnly ? [String(matches.length)] : matches, stderr: [], exitCode: matches.length ? 0 : 1, openedArtifactIds: source.artifacts };
  }
  if (tool === 'wc') {
    if (args[0] !== '-l') return { tool, stdout: [], stderr: ['wc: use wc -l [file]'], exitCode: 2 };
    const source = readFile(environment, cwd, args[1], stdin);
    return source.exitCode ? { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode } : { tool, stdout: [String(source.stdout.length)], stderr: [], exitCode: 0, openedArtifactIds: source.artifacts };
  }
  if (tool === 'sort') {
    const source = readFile(environment, cwd, args[0], stdin);
    return source.exitCode ? { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode } : { tool, stdout: [...source.stdout].sort(), stderr: [], exitCode: 0, openedArtifactIds: source.artifacts };
  }
  if (tool === 'uniq') {
    const source = readFile(environment, cwd, args.find((arg) => !arg.startsWith('-')), stdin);
    if (source.exitCode) return { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode };
    const groups: Array<{ value: string; count: number }> = [];
    for (const line of source.stdout) {
      const last = groups.at(-1);
      if (last?.value === line) last.count += 1; else groups.push({ value: line, count: 1 });
    }
    return { tool, stdout: groups.map((group) => args.includes('-c') ? `${group.count} ${group.value}` : group.value), stderr: [], exitCode: 0 };
  }
  if (tool === 'cut') {
    const d = args.indexOf('-d'); const f = args.indexOf('-f');
    const delimiter = d >= 0 ? args[d + 1] : undefined; const field = f >= 0 ? Number(args[f + 1]) : 0;
    const fileArg = args.find((arg, index) => !arg.startsWith('-') && ![d + 1, f + 1].includes(index));
    if (!delimiter || field < 1) return { tool, stdout: [], stderr: ['cut: use cut -d <sep> -f <n> [file]'], exitCode: 2 };
    const source = readFile(environment, cwd, fileArg, stdin);
    return source.exitCode ? { tool, stdout: [], stderr: source.stderr, exitCode: source.exitCode } : { tool, stdout: source.stdout.map((line) => line.split(delimiter)[field - 1] ?? ''), stderr: [], exitCode: 0, openedArtifactIds: source.artifacts };
  }
  if (tool === 'find') {
    const base = normalizeCasePath(environment.home, cwd, args[0] ?? '.');
    const patternIndex = args.indexOf('-name');
    const pattern = patternIndex >= 0 ? args[patternIndex + 1].replaceAll('*', '') : '';
    const stdout = Object.keys(environment.files).filter((path) => path.startsWith(base) && (!pattern || path.includes(pattern))).sort();
    return { tool, stdout, stderr: [], exitCode: 0 };
  }
  return { tool, stdout: [], stderr: [`${name}: command not found`], exitCode: 127 };
}

export function runCaseCommand(environment: CaseEnvironment, cwd: string, raw: string): CaseCommandResult {
  const trimmed = raw.trim();
  const parsed = splitPipeline(trimmed);
  if (parsed.error) return { stdout: [], stderr: [parsed.error], exitCode: 2, cwd, openedArtifactIds: [], payload: { command: trimmed, success: false, exitCode: 2, stderr: parsed.error, readOnly: true } };
  const destructive = /(^|\s)(rm|mv|chmod|chown|truncate|dd)(\s|$)/i.test(trimmed);
  const externalNetwork = /(^|\s)(curl|wget|nc|nmap|ssh)(\s|$)/i.test(trimmed);
  if (destructive || externalNetwork) {
    const stderr = destructive ? 'operation blocked: source evidence is read-only' : 'operation blocked: external network disabled';
    return { stdout: [], stderr: [stderr], exitCode: 126, cwd, openedArtifactIds: [], payload: { command: trimmed, success: false, exitCode: 126, stderr, readOnly: true, destructive, externalNetwork } };
  }
  let stdin: string[] | null = null;
  let nextCwd = cwd;
  const stderr: string[] = [];
  const tools: string[] = [];
  const artifacts = new Set<string>();
  let exitCode = 0;
  for (const stage of parsed.stages) {
    const result = executeStage(environment, nextCwd, stage, stdin);
    tools.push(result.tool);
    result.openedArtifactIds?.forEach((id) => artifacts.add(id));
    stderr.push(...result.stderr);
    stdin = result.stdout;
    nextCwd = result.cwd ?? nextCwd;
    exitCode = result.exitCode;
    if (exitCode !== 0 && result.stdout.length === 0) break;
  }
  if (parsed.redirect) {
    const path = normalizeCasePath(environment.home, nextCwd, parsed.redirect);
    if (!path.startsWith(`${environment.home}/work/`)) {
      stderr.push('redirection blocked: write only inside work/');
      exitCode = 126;
    }
  }
  const stdout = stdin ?? [];
  const finding = exitCode === 0 ? environment.detectFinding?.({ raw: trimmed, stdout, tools }) : undefined;
  const payload: EventPayload = {
    command: trimmed,
    tools,
    stdout: stdout.slice(0, 80),
    stderr: stderr.slice(0, 40),
    exitCode,
    success: exitCode === 0,
    readOnly: true,
    destructive,
    externalNetwork,
    nextCwd,
    targetArtifactId: [...artifacts][0] ?? null,
    openedArtifactIds: [...artifacts],
    finding: finding ?? null,
  };
  return { stdout, stderr, exitCode, cwd: nextCwd, openedArtifactIds: [...artifacts], payload, clear: tools.includes('clear') };
}
