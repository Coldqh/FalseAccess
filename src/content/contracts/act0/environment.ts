import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';

function rng(seed: number) {
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

export interface Act0ContractEnvironment {
  shell: CaseEnvironment;
  title: string;
  client: string;
  pay: number;
  objective: string;
  evidenceSuggestion: { claimId: string; evidenceId: string; label: string; note: string };
}

export function createAct0ContractEnvironment(missionId: string, seed: number): Act0ContractEnvironment {
  const random = rng(seed);
  const home = `/home/ilya/contracts/${missionId}`;
  if (missionId === 'act0-contract-files') {
    const targetName = pick(random, ['incident-note.txt', 'handoff.md', 'asset-owner.txt']);
    const targetPath = `${home}/archive/${pick(random, ['march', 'night', 'case-17'])}/${targetName}`;
    const shell: CaseEnvironment = {
      seed, home,
      directories: ['/', '/home', '/home/ilya', '/home/ilya/contracts', home, `${home}/archive`, targetPath.slice(0, targetPath.lastIndexOf('/')), `${home}/tmp`, `${home}/work`],
      files: {
        [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.contract.files.brief', content: `Найди ${targetName}. Не используй подсказки. Зафиксируй путь и открой файл.` },
        [targetPath]: { path: targetPath, artifactId: 'artifact.contract.files.target', content: `OWNER=${pick(random, ['clinic-admin', 'night-operator', 'vendor-support'])}\nSTATUS=review-required` },
        [`${home}/tmp/${targetName}.bak`]: { path: `${home}/tmp/${targetName}.bak`, content: 'STALE COPY' },
      },
      facts: { targetPath },
      detectFinding: ({ raw, stdout, tools }) => (tools.includes('find') && stdout.includes(targetPath)) || (raw.includes(targetPath) && stdout.some((line) => line.includes('OWNER='))) ? 'contract-file-target' : undefined,
    };
    return { shell, title: 'Потерянный handoff', client: 'ЛИНИЯ', pay: 1200, objective: 'Самостоятельно найти актуальный файл среди каталогов и старой копии.', evidenceSuggestion: { claimId: 'outcome.contract.files', evidenceId: 'artifact.contract.files.target', label: 'Связать найденный файл', note: 'Путь и содержимое получены выполненными командами.' } };
  }

  if (missionId === 'act0-contract-logs') {
    const source = `${pick(random, [45, 62, 77, 91, 103])}.${Math.floor(random() * 180) + 20}.${Math.floor(random() * 180) + 20}.${Math.floor(random() * 180) + 20}`;
    const count = Math.floor(random() * 4) + 5;
    const lines = ['Apr 12 01:10:01 edge sshd[100]: Accepted publickey for backup from 10.10.1.5 port 41000 ssh2'];
    for (let i = 0; i < count; i += 1) lines.push(`Apr 12 01:1${i}:0${i} edge sshd[${200 + i}]: Failed password for ${['root','admin','ops'][i % 3]} from ${source} port ${42000 + i} ssh2`);
    const shell: CaseEnvironment = {
      seed, home,
      directories: ['/', '/home', '/home/ilya', '/home/ilya/contracts', home, `${home}/logs`, `${home}/work`],
      files: {
        [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.contract.logs.brief', content: 'Определи внешний источник и число отказов. Ручной пересчёт не считается.' },
        [`${home}/logs/auth.log`]: { path: `${home}/logs/auth.log`, artifactId: 'artifact.contract.logs.auth', content: lines.join('\n') },
      },
      facts: { source, count },
      detectFinding: ({ raw, stdout, tools }) => {
        const text = `${raw}\n${stdout.join('\n')}`;
        if (tools.includes('grep') && tools.includes('wc') && text.includes(source) && text.includes(String(count))) return 'contract-log-source-count';
        if (tools.includes('grep') && text.includes(source) && raw.includes('-c')) return 'contract-log-source-count';
        return undefined;
      },
    };
    return { shell, title: 'Ночная серия входов', client: 'СФЕРА', pay: 1800, objective: 'Без помощи получить источник и воспроизводимый счётчик отказов.', evidenceSuggestion: { claimId: 'outcome.contract.logs', evidenceId: 'artifact.contract.logs.auth', label: 'Связать auth.log', note: 'Источник и count получены shell-командами.' } };
  }

  const pid = Math.floor(random() * 100) + 700;
  const remote = `198.51.100.${Math.floor(random() * 180) + 20}`;
  const processes = ['PID,PPID,USER,PATH', '1,0,root,/sbin/init', '400,1,root,/usr/sbin/sshd', `${pid},400,svc,/var/tmp/cache-sync`, '810,1,www,/opt/app/server'];
  const connections = ['PID,LOCAL,REMOTE,STATE', '810,127.0.0.1:8080,127.0.0.1:50100,ESTAB', `${pid},10.12.4.7:53110,${remote}:443,ESTAB`];
  const shell: CaseEnvironment = {
    seed, home,
    directories: ['/', '/home', '/home/ilya', '/home/ilya/contracts', home, `${home}/evidence`, `${home}/work`],
    files: {
      [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.contract.process.brief', content: 'Свяжи подозрительный путь с внешним соединением по PID.' },
      [`${home}/evidence/processes.csv`]: { path: `${home}/evidence/processes.csv`, artifactId: 'artifact.contract.process.processes', content: processes.join('\n') },
      [`${home}/evidence/connections.csv`]: { path: `${home}/evidence/connections.csv`, artifactId: 'artifact.contract.process.network', content: connections.join('\n') },
    },
    processOutput: processes,
    networkOutput: connections,
    facts: { pid, remote },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if ((tools.includes('ps') || text.includes('processes.csv')) && text.includes(String(pid))) return 'contract-process-found';
      if ((tools.includes('ss') || text.includes('connections.csv')) && text.includes(String(pid)) && text.includes(remote)) return 'contract-process-network';
      return undefined;
    },
  };
  return { shell, title: 'Процесс и соединение', client: 'СЕВЕРНЫЙ КРУГ', pay: 2200, objective: 'Самостоятельно связать PID, путь и внешний адрес.', evidenceSuggestion: { claimId: 'outcome.contract.process', evidenceId: 'artifact.contract.process.network', label: 'Связать network snapshot', note: 'PID и remote получены из двух артефактов.' } };
}
