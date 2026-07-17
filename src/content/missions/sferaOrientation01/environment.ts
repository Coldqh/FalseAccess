import type { CaseEnvironment } from '../../../simulation/terminal/caseEnvironment';
import type { SocQueueItem } from '../../../components/SocQueuePanel';

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

export interface SferaOrientationBundle {
  shell: CaseEnvironment;
  queue: SocQueueItem[];
  facts: {
    host: string;
    user: string;
    senderDomain: string;
    beaconDomain: string;
    pid: number;
  };
}

export function createSferaOrientationEnvironment(seed: number): SferaOrientationBundle {
  const random = rng(seed);
  const host = pick(random, ['ACC-WS-07', 'FIN-WS-12', 'HR-WS-04']);
  const user = pick(random, ['m.rybina', 'a.krylova', 'e.sazonov']);
  const senderDomain = pick(random, ['sfera-career.com', 'sfera-payroll.net', 'sfera-hr.org']);
  const beaconDomain = pick(random, ['update-cache-check.test', 'cdn-profile-sync.test', 'telemetry-node-check.test']);
  const pid = Math.floor(random() * 900) + 4200;
  const home = '/home/ilya/sfera/orientation-01';

  const alerts = [
    JSON.stringify({ id: 'MAIL-441', severity: 'HIGH', entity: user, source: 'mail-gateway', title: 'Display name mismatch' }),
    JSON.stringify({ id: 'EDR-733', severity: 'CRITICAL', entity: host, source: 'endpoint', title: 'Office spawned encoded PowerShell' }),
    JSON.stringify({ id: 'DNS-184', severity: 'MEDIUM', entity: host, source: 'dns', title: 'Periodic external lookup' }),
    JSON.stringify({ id: 'AUTH-019', severity: 'LOW', entity: user, source: 'identity', title: 'Known device session refresh' }),
  ].join('\n');

  const mail = [
    `From: HR Portal <updates@${senderDomain}>`,
    'To: ' + user + '@sfera.local',
    'Subject: Изменение зарплаты',
    'Authentication-Results: spf=fail dkim=none dmarc=fail',
    `Received: from mx.${senderDomain} by mail.sfera.local`,
    'Content-Disposition: attachment; filename="salary_update.docm"',
    '',
    'Откройте документ до конца дня.',
  ].join('\n');

  const processes = [
    'TIME,HOST,USER,PID,PPID,IMAGE,PARENT,COMMAND',
    `10:26:39,${host},SFERA\\${user},3112,2100,WINWORD.EXE,explorer.exe,"WINWORD.EXE salary_update.docm"`,
    `10:26:41,${host},SFERA\\${user},${pid},3112,powershell.exe,WINWORD.EXE,"powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBFAFgA"`,
    `10:27:02,${host},SYSTEM,920,704,svchost.exe,services.exe,"svchost.exe -k netsvcs"`,
    '10:28:11,PRINT-02,SYSTEM,881,704,spoolsv.exe,services.exe,"spoolsv.exe"',
  ].join('\n');

  const dns = [
    `11:02:06,10.23.8.12,updates.microsoft.com,NOERROR`,
    `11:04:14,10.23.8.44,${beaconDomain},NOERROR`,
    `11:05:13,10.23.8.44,${beaconDomain},NOERROR`,
    `11:06:15,10.23.8.44,${beaconDomain},NOERROR`,
    `11:07:14,10.23.8.44,${beaconDomain},NOERROR`,
    `11:08:16,10.23.8.44,${beaconDomain},NOERROR`,
    `11:09:03,10.23.8.1,ntp.sfera.local,NOERROR`,
  ].join('\n');

  const assets = [
    'HOST,IP,OWNER,CRITICALITY',
    `${host},10.23.8.44,${user},MEDIUM`,
    'PRINT-02,10.23.8.12,office-services,LOW',
    'DC-01,10.23.8.1,identity-team,HIGH',
  ].join('\n');

  const identity = [
    `10:12:00,SUCCESS,${user},10.23.8.44,managed-device,mfa-satisfied`,
    `10:24:00,SESSION_REFRESH,${user},10.23.8.44,managed-device,existing-session`,
    `10:31:00,FAILURE,${user},198.51.100.73,unknown-device,mfa-required`,
  ].join('\n');

  const files: CaseEnvironment['files'] = {
    [`${home}/shift-brief.txt`]: { path: `${home}/shift-brief.txt`, artifactId: 'artifact.sfera.brief', content: 'Разбери очередь. Alert не равен incident. Верни факты, scope, ограничения и безопасное первое действие.' },
    [`${home}/telemetry/alerts.jsonl`]: { path: `${home}/telemetry/alerts.jsonl`, artifactId: 'artifact.sfera.alerts', content: alerts },
    [`${home}/mail/salary_update.eml`]: { path: `${home}/mail/salary_update.eml`, artifactId: 'artifact.sfera.mail', content: mail },
    [`${home}/endpoint/processes.csv`]: { path: `${home}/endpoint/processes.csv`, artifactId: 'artifact.sfera.processes', content: processes },
    [`${home}/network/dns.log`]: { path: `${home}/network/dns.log`, artifactId: 'artifact.sfera.dns', content: dns },
    [`${home}/inventory/assets.csv`]: { path: `${home}/inventory/assets.csv`, artifactId: 'artifact.sfera.assets', content: assets },
    [`${home}/identity/identity.log`]: { path: `${home}/identity/identity.log`, artifactId: 'artifact.sfera.auth', content: identity },
  };

  const shell: CaseEnvironment = {
    seed,
    home,
    directories: [
      '/', '/home', '/home/ilya', '/home/ilya/sfera', home,
      `${home}/telemetry`, `${home}/mail`, `${home}/endpoint`, `${home}/network`, `${home}/inventory`, `${home}/identity`, `${home}/work`,
    ],
    files,
    processOutput: processes.split('\n'),
    networkOutput: dns.split('\n'),
    facts: { host, user, senderDomain, beaconDomain, pid },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if (text.includes(senderDomain) && (text.includes('spf=fail') || text.includes('dmarc=fail'))) return 'sfera-mail-domain';
      if (text.includes(host) && text.includes(String(pid)) && text.includes('WINWORD.EXE') && text.includes('powershell.exe')) return 'sfera-process-chain';
      if (text.includes(beaconDomain) && (tools.includes('uniq') || tools.includes('wc') || raw.includes('-c'))) return 'sfera-dns-beacon';
      if (text.includes(host) && text.includes('10.23.8.44') && (text.includes('MEDIUM') || text.includes(user))) return 'sfera-scope-host';
      return undefined;
    },
  };

  const queue: SocQueueItem[] = [
    { id: 'MAIL-441', time: '09:42', severity: 'HIGH', title: 'Подозрительное письмо', entity: user, summary: 'Display name совпадает с HR, домен отправителя другой.', artifactId: 'artifact.sfera.mail', finding: 'sfera-queue-mail', source: 'MAIL GATEWAY' },
    { id: 'EDR-733', time: '10:26', severity: 'CRITICAL', title: 'Office → PowerShell', entity: host, summary: 'WINWORD запустил PowerShell с EncodedCommand.', artifactId: 'artifact.sfera.processes', finding: 'sfera-queue-endpoint', source: 'EDR' },
    { id: 'DNS-184', time: '11:04', severity: 'MEDIUM', title: 'Периодический DNS', entity: host, summary: 'Один хост повторяет запросы к внешнему имени.', artifactId: 'artifact.sfera.dns', finding: 'sfera-queue-dns', source: 'DNS' },
  ];

  return { shell, queue, facts: { host, user, senderDomain, beaconDomain, pid } };
}
