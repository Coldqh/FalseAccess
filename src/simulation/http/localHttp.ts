import type { CaseCustomCommandResult } from '../terminal/caseEnvironment';

export interface LocalHttpExchange {
  id: string;
  method: string;
  path: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  status: number;
  reason: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  artifactId?: string;
}

function render(exchange: LocalHttpExchange, replay = false): string[] {
  return [
    `REQUEST ${exchange.id}${replay ? ' / LOCAL REPLAY' : ''}`,
    `> ${exchange.method} ${exchange.path} HTTP/1.1`,
    ...Object.entries(exchange.requestHeaders).map(([name, value]) => `> ${name}: ${value}`),
    ...(exchange.requestBody ? ['>', exchange.requestBody] : []),
    `< HTTP/1.1 ${exchange.status} ${exchange.reason}`,
    ...Object.entries(exchange.responseHeaders).map(([name, value]) => `< ${name}: ${value}`),
    '<',
    exchange.responseBody,
  ];
}

export function runLocalHttpCommand(exchanges: LocalHttpExchange[], args: string[]): CaseCustomCommandResult {
  if (args.some((arg) => arg.includes('://') || arg.startsWith('//'))) {
    return { stdout: [], stderr: ['http: external hosts are blocked; use captured local exchange ids'], exitCode: 126 };
  }

  const action = (args[0] ?? 'help').toLowerCase();
  if (action === 'help') {
    return {
      stdout: [
        'http list',
        'http show <request-id>',
        'http replay <request-id>',
        'http find <path-fragment>',
        'Only synthetic exchanges from the local lab are available.',
      ],
      stderr: [],
      exitCode: 0,
    };
  }
  if (action === 'list') {
    return {
      stdout: exchanges.map((item) => `${item.id},${item.method},${item.path},${item.status}`),
      stderr: [],
      exitCode: 0,
    };
  }
  if (action === 'find') {
    const fragment = args.slice(1).join(' ').trim();
    if (!fragment) return { stdout: [], stderr: ['http find: path fragment required'], exitCode: 2 };
    const matches = exchanges.filter((item) => item.path.includes(fragment));
    return {
      stdout: matches.map((item) => `${item.id},${item.method},${item.path},${item.status}`),
      stderr: [],
      exitCode: matches.length ? 0 : 1,
    };
  }
  if (action === 'show' || action === 'replay') {
    const id = args[1];
    if (!id) return { stdout: [], stderr: [`http ${action}: request id required`], exitCode: 2 };
    const exchange = exchanges.find((item) => item.id === id);
    if (!exchange) return { stdout: [], stderr: [`http: exchange ${id} not found`], exitCode: 1 };
    return {
      stdout: render(exchange, action === 'replay'),
      stderr: [],
      exitCode: 0,
      openedArtifactIds: exchange.artifactId ? [exchange.artifactId] : [],
    };
  }
  return { stdout: [], stderr: [`http: unknown action ${action}`], exitCode: 2 };
}
