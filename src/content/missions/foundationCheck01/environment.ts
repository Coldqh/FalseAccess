import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';
import type { PythonDataset } from '../clinic01/environment';

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export interface FoundationEnvironmentBundle {
  shell: CaseEnvironment;
  visiblePython: PythonDataset;
  hiddenPython: PythonDataset;
}

function events(source: string, failures: number, pid: number, remote: string, relation: string) {
  const lines = [JSON.stringify({ type: 'auth', outcome: 'success', src: '10.33.4.8', external: false, at: '2026-04-18T00:11:00Z' })];
  for (let i = 0; i < failures; i += 1) lines.push(JSON.stringify({ type: 'auth', outcome: 'failed', src: source, external: true, at: `2026-04-18T01:${String(10 + i).padStart(2, '0')}:00Z` }));
  lines.push(JSON.stringify({ type: 'process', pid, suspicious: true, path: '/var/tmp/agent-check', at: '2026-04-18T00:22:00Z' }));
  lines.push(JSON.stringify({ type: 'network', pid, remote, relation, at: '2026-04-18T00:23:00Z' }));
  lines.splice(2, 0, 'collector partial line');
  return lines.join('\n');
}

export function createFoundationEnvironment(seed: number): FoundationEnvironmentBundle {
  const rand = random(seed);
  const source = `203.0.113.${Math.floor(rand() * 180) + 20}`;
  const failures = Math.floor(rand() * 4) + 6;
  const pid = Math.floor(rand() * 100) + 1200;
  const remote = `192.0.2.${Math.floor(rand() * 180) + 20}`;
  const hiddenSource = `198.51.100.${Math.floor(rand() * 180) + 20}`;
  const hiddenFailures = Math.floor(rand() * 5) + 5;
  const hiddenPid = pid + 77;
  const hiddenRemote = `203.0.113.${Math.floor(rand() * 180) + 20}`;
  const home = '/home/ilya/checks/foundation-01';
  const visible = events(source, failures, pid, remote, 'separate-earlier-event');
  const hidden = events(hiddenSource, hiddenFailures, hiddenPid, hiddenRemote, 'separate-earlier-event');
  const processLines = ['PID,PPID,USER,START,PATH', '1,0,root,00:00,/sbin/init', `${pid},1,svc,00:22,/var/tmp/agent-check`, '1301,1,www,00:01,/opt/portal/server'];
  const networkLines = ['PID,LOCAL,REMOTE,STATE', `${pid},10.33.4.19:52120,${remote}:443,ESTAB`, '1301,127.0.0.1:8080,127.0.0.1:50112,ESTAB'];
  const authLines = Array.from({ length: failures }, (_, i) => `Apr 18 04:${String(10 + i).padStart(2, '0')}:00 branch sshd[${300 + i}]: Failed password for root from ${source} port ${43000 + i} ssh2`);
  const shell: CaseEnvironment = {
    seed, home,
    directories: ['/', '/home', '/home/ilya', '/home/ilya/checks', home, `${home}/host`, `${home}/gateway`, `${home}/work`],
    files: {
      [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.foundation.brief', content: 'Филиал сообщает о ночной активности. Тип проблемы не указан. Установи факты, раздели события и предложи первое действие.' },
      [`${home}/host/auth.log`]: { path: `${home}/host/auth.log`, artifactId: 'artifact.foundation.auth', content: authLines.join('\n') },
      [`${home}/host/processes.csv`]: { path: `${home}/host/processes.csv`, artifactId: 'artifact.foundation.processes', content: processLines.join('\n') },
      [`${home}/host/connections.csv`]: { path: `${home}/host/connections.csv`, artifactId: 'artifact.foundation.network', content: networkLines.join('\n') },
      [`${home}/gateway/proxy.csv`]: { path: `${home}/gateway/proxy.csv`, artifactId: 'artifact.foundation.proxy', content: `timestamp_utc,src,dst,status\n2026-04-18T00:23:01Z,10.33.4.19,${remote},200\n2026-04-18T01:15:00Z,10.33.4.8,updates.vendor.test,200` },
      [`${home}/host/events.jsonl`]: { path: `${home}/host/events.jsonl`, artifactId: 'artifact.foundation.events', content: visible },
    },
    processOutput: processLines,
    networkOutput: networkLines,
    facts: { source, failures, pid, remote },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if (tools.includes('grep') && text.includes(source)) return 'foundation-auth-finding';
      if ((tools.includes('ps') || text.includes('processes.csv')) && text.includes(String(pid))) return 'foundation-process-finding';
      if ((tools.includes('ss') || text.includes('connections.csv')) && text.includes(remote)) return 'foundation-network-finding';
      if (text.includes('proxy.csv') && text.includes(remote)) return 'foundation-proxy-finding';
      return undefined;
    },
  };
  return {
    shell,
    visiblePython: { path: '/home/pyodide/foundation-events.jsonl', content: visible, expected: { external_failures: failures, external_success: false, suspicious_pid: pid, remote_ip: remote } },
    hiddenPython: { path: '/home/pyodide/foundation-hidden.jsonl', content: hidden, expected: { external_failures: hiddenFailures, external_success: false, suspicious_pid: hiddenPid, remote_ip: hiddenRemote } },
  };
}

export const foundationPythonStarter = `import json

def analyze(path):
    # Верни external_failures, external_success, suspicious_pid, remote_ip.
    # Формат полей отличается от CLINIC-01: type/outcome/src.
    result = {"external_failures": 0, "external_success": False, "suspicious_pid": None, "remote_ip": None}
    return result
`;
