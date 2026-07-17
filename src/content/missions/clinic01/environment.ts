import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';

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

export interface PythonDataset {
  path: string;
  content: string;
  expected: {
    external_failures: number;
    external_success: boolean;
    suspicious_pid: number;
    remote_ip: string;
  };
}

export interface ClinicEnvironmentBundle {
  shell: CaseEnvironment;
  visiblePython: PythonDataset;
  hiddenPython: PythonDataset;
}

function buildEvents(input: {
  source: string;
  failures: number;
  suspiciousPid: number;
  remoteIp: string;
  includeBroken: boolean;
}) {
  const lines: string[] = [
    JSON.stringify({ kind: 'auth', result: 'success', source: '10.14.2.18', user: 'nurse', external: false }),
    JSON.stringify({ kind: 'process', pid: 804, ppid: 1, user: 'root', path: '/usr/local/bin/clinic-backup', suspicious: false }),
  ];
  for (let index = 0; index < input.failures; index += 1) {
    lines.push(JSON.stringify({ kind: 'auth', result: 'failed', source: input.source, user: ['admin', 'root', 'postgres'][index % 3], external: true }));
  }
  lines.push(JSON.stringify({ kind: 'process', pid: input.suspiciousPid, ppid: 804, user: 'nobody', path: '/tmp/.cache/update-agent', suspicious: true }));
  lines.push(JSON.stringify({ kind: 'network', pid: input.suspiciousPid, remote: input.remoteIp, port: 443, state: 'ESTAB' }));
  lines.push(JSON.stringify({ kind: 'auth', result: 'success', source: '10.14.2.5', user: 'backup', external: false }));
  if (input.includeBroken) lines.splice(3, 0, 'BROKEN EVENT');
  return lines.join('\n');
}

export function createClinicEnvironment(seed: number): ClinicEnvironmentBundle {
  const random = mulberry32(seed);
  const externalSource = `${pick(random, [45, 62, 77, 91, 103, 185])}.${Math.floor(random() * 180) + 20}.${Math.floor(random() * 200) + 20}.${Math.floor(random() * 200) + 20}`;
  const failures = Math.floor(random() * 3) + 6;
  const suspiciousPid = Math.floor(random() * 90) + 900;
  const remoteIp = `198.51.100.${Math.floor(random() * 180) + 20}`;
  const hiddenSource = `203.0.113.${Math.floor(random() * 180) + 20}`;
  const hiddenFailures = Math.floor(random() * 4) + 5;
  const hiddenPid = suspiciousPid + 113;
  const hiddenRemote = `192.0.2.${Math.floor(random() * 180) + 20}`;
  const home = '/home/ilya/cases/clinic-01';

  const authLines = [
    'Mar 14 21:08:11 clinic-ws sshd[1092]: Accepted password for nurse from 10.14.2.18 port 55192 ssh2',
    ...Array.from({ length: failures }, (_, index) => `Mar 14 21:1${1 + Math.floor(index / 4)}:${String(42 + index * 3).padStart(2, '0')} clinic-ws sshd[${1188 + index}]: Failed password for ${['admin', 'root', 'postgres'][index % 3]} from ${externalSource} port ${43110 + index * 11} ssh2`),
    'Mar 14 21:17:08 clinic-ws sshd[1280]: Accepted publickey for backup from 10.14.2.5 port 49818 ssh2',
  ];
  const processes = [
    'PID,PPID,USER,START,PATH,ARGS',
    '1,0,root,20:00:01,/sbin/init,/sbin/init',
    '412,1,root,20:00:12,/usr/sbin/sshd,/usr/sbin/sshd -D',
    '667,1,nurse,20:04:33,/usr/bin/firefox,/usr/bin/firefox --profile clinic',
    '721,1,clinic,20:00:44,/opt/clinic/api,/opt/clinic/api --listen 127.0.0.1:8080',
    '804,1,root,20:30:00,/usr/local/bin/clinic-backup,/usr/local/bin/clinic-backup --watch',
    `${suspiciousPid},804,nobody,21:12:24,/tmp/.cache/update-agent,/tmp/.cache/update-agent --silent`,
  ];
  const connections = [
    'PID,LOCAL,REMOTE,STATE',
    '721,127.0.0.1:8080,127.0.0.1:45110,ESTAB',
    '667,10.14.2.18:53211,10.14.2.9:3128,ESTAB',
    `${suspiciousPid},10.14.2.18:54442,${remoteIp}:443,ESTAB`,
  ];
  const visibleContent = buildEvents({ source: externalSource, failures, suspiciousPid, remoteIp, includeBroken: true });
  const hiddenContent = buildEvents({ source: hiddenSource, failures: hiddenFailures, suspiciousPid: hiddenPid, remoteIp: hiddenRemote, includeBroken: true });

  const shell: CaseEnvironment = {
    seed,
    home,
    directories: ['/', '/home', '/home/ilya', '/home/ilya/cases', home, `${home}/evidence`, `${home}/work`],
    files: {
      [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.clinic.brief', content: [
        'CLINIC-01 / КОМПЬЮТЕР РЕГИСТРАТУРЫ',
        `Внешний источник из предыдущей главы: ${externalSource}`,
        'Проверь процессы и соединения. Затем напиши analyze(path), который возвращает словарь:',
        'external_failures, external_success, suspicious_pid, remote_ip.',
        'Не связывай password spray и локальный процесс без временного или причинного evidence.',
      ].join('\n') },
      [`${home}/evidence/auth.log`]: { path: `${home}/evidence/auth.log`, artifactId: 'artifact.clinic.auth-log', content: authLines.join('\n') },
      [`${home}/evidence/processes.csv`]: { path: `${home}/evidence/processes.csv`, artifactId: 'artifact.clinic.processes', content: processes.join('\n') },
      [`${home}/evidence/connections.csv`]: { path: `${home}/evidence/connections.csv`, artifactId: 'artifact.clinic.network', content: connections.join('\n') },
      [`${home}/evidence/events.jsonl`]: { path: `${home}/evidence/events.jsonl`, artifactId: 'artifact.clinic.events', content: visibleContent },
    },
    processOutput: processes,
    networkOutput: connections,
    facts: { externalSource, failures, suspiciousPid, remoteIp },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if (tools.includes('ps') || (text.includes('processes.csv') && text.includes(String(suspiciousPid)))) return 'clinic-process-correlated';
      if (tools.includes('ss') || (text.includes('connections.csv') && text.includes(String(suspiciousPid)) && text.includes(remoteIp))) return 'clinic-network-correlated';
      if (text.includes('auth.log') && text.includes(externalSource)) return 'clinic-auth-reviewed';
      return undefined;
    },
  };

  return {
    shell,
    visiblePython: {
      path: '/home/pyodide/events.jsonl',
      content: visibleContent,
      expected: { external_failures: failures, external_success: false, suspicious_pid: suspiciousPid, remote_ip: remoteIp },
    },
    hiddenPython: {
      path: '/home/pyodide/hidden-events.jsonl',
      content: hiddenContent,
      expected: { external_failures: hiddenFailures, external_success: false, suspicious_pid: hiddenPid, remote_ip: hiddenRemote },
    },
  };
}

export const clinicPythonStarter = `import json

def analyze(path):
    result = {
        "external_failures": 0,
        "external_success": False,
        "suspicious_pid": None,
        "remote_ip": None,
    }
    # Прочитай JSONL построчно. Повреждённую строку пропусти через try/except.
    # Не используй значения из задания напрямую: hidden-набор будет другим.
    return result
`;
