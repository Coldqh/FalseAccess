import type { CaseCustomCommandResult } from '../terminal/caseEnvironment';

export type LocalSqlValue = string | number | boolean | null;
export type LocalSqlRow = Record<string, LocalSqlValue>;

export interface LocalSqlTable {
  name: string;
  columns: string[];
  rows: LocalSqlRow[];
  artifactId?: string;
}

function csv(value: LocalSqlValue): string {
  if (value === null) return '';
  const text = String(value);
  return /[,"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseLiteral(raw: string): LocalSqlValue {
  const value = raw.trim().replace(/^['"]|['"]$/g, '');
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  if (value.toLowerCase() === 'null') return null;
  return value;
}

function compare(left: LocalSqlValue, right: LocalSqlValue): boolean {
  return String(left ?? '') === String(right ?? '');
}

export function runLocalSqlCommand(tables: LocalSqlTable[], args: string[]): CaseCustomCommandResult {
  const query = args.join(' ').trim();
  if (!query || query.toLowerCase() === 'help') {
    return {
      stdout: [
        'sql tables',
        'sql schema <table>',
        'sql "SELECT col1,col2 FROM table WHERE field=\'value\' ORDER BY field"',
        'Read-only SELECT queries only.',
      ],
      stderr: [],
      exitCode: 0,
    };
  }
  if (query.toLowerCase() === 'tables') {
    return { stdout: tables.map((table) => table.name), stderr: [], exitCode: 0 };
  }
  if (query.toLowerCase().startsWith('schema ')) {
    const name = query.slice(7).trim();
    const table = tables.find((item) => item.name === name);
    return table
      ? { stdout: [`${table.name}(${table.columns.join(', ')})`], stderr: [], exitCode: 0, openedArtifactIds: table.artifactId ? [table.artifactId] : [] }
      : { stdout: [], stderr: [`sql: table ${name} not found`], exitCode: 1 };
  }
  if (!/^select\s/i.test(query)) {
    return { stdout: [], stderr: ['sql: only read-only SELECT is allowed'], exitCode: 126 };
  }

  const match = query.match(/^select\s+(.+?)\s+from\s+([a-zA-Z_][\w]*)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+([a-zA-Z_][\w]*)(?:\s+(asc|desc))?)?\s*;?$/i);
  if (!match) return { stdout: [], stderr: ['sql: unsupported SELECT syntax'], exitCode: 2 };
  const [, columnsRaw, tableName, whereRaw, orderField, orderDirection] = match;
  const table = tables.find((item) => item.name.toLowerCase() === tableName.toLowerCase());
  if (!table) return { stdout: [], stderr: [`sql: table ${tableName} not found`], exitCode: 1 };

  let rows = [...table.rows];
  if (whereRaw) {
    const conditions = whereRaw.split(/\s+and\s+/i).map((condition) => {
      const conditionMatch = condition.trim().match(/^([a-zA-Z_][\w]*)\s*=\s*(.+)$/);
      return conditionMatch ? { field: conditionMatch[1], value: parseLiteral(conditionMatch[2]) } : null;
    });
    if (conditions.some((item) => item === null)) return { stdout: [], stderr: ['sql: unsupported WHERE clause'], exitCode: 2 };
    rows = rows.filter((row) => conditions.every((item) => item && compare(row[item.field], item.value)));
  }
  if (orderField) {
    rows.sort((left, right) => String(left[orderField] ?? '').localeCompare(String(right[orderField] ?? '')) * (orderDirection?.toLowerCase() === 'desc' ? -1 : 1));
  }

  const countMatch = columnsRaw.trim().match(/^count\(\*\)(?:\s+as\s+([a-zA-Z_][\w]*))?$/i);
  if (countMatch) {
    const name = countMatch[1] ?? 'count';
    return { stdout: [name, String(rows.length)], stderr: [], exitCode: 0, openedArtifactIds: table.artifactId ? [table.artifactId] : [] };
  }

  const columns = columnsRaw.trim() === '*' ? table.columns : columnsRaw.split(',').map((item) => item.trim());
  const unknown = columns.find((column) => !table.columns.includes(column));
  if (unknown) return { stdout: [], stderr: [`sql: unknown column ${unknown}`], exitCode: 1 };
  return {
    stdout: [columns.join(','), ...rows.map((row) => columns.map((column) => csv(row[column] ?? null)).join(','))],
    stderr: [],
    exitCode: 0,
    openedArtifactIds: table.artifactId ? [table.artifactId] : [],
  };
}
