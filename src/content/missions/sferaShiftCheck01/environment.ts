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

export interface SferaShiftBundle {
  shell: CaseEnvironment;
  queue: SocQueueItem[];
}

export function createSferaShiftEnvironment(seed: number): SferaShiftBundle {
  const random = rng(seed);
  const host = pick(random, ['FIN-WS-09', 'ACC-WS-11', 'OPS-WS-14']);
  const user = pick(random, ['a.krylova', 'm.rybina', 'v.antonov']);
  const senderDomain = pick(random, ['vendor-payments.co', 'invoice-change.net', 'billing-confirm.org']);
  const beaconDomain = pick(random, ['cdn-ledger-sync.test', 'update-profile-check.test', 'telemetry-payments-node.test']);
  const pid = Math.floor(random() * 900) + 6100;
  const remote = `203.0.113.${Math.floor(random() * 170) + 20}`;
  const home = '/home/ilya/sfera/shift-01';

  const alerts = [
    JSON.stringify({ id: 'MAIL-612', severity: 'HIGH', entity: user, source: 'mail-gateway', title: 'Invoice domain mismatch' }),
    JSON.stringify({ id: 'EDR-812', severity: 'CRITICAL', entity: host, source: 'endpoint', title: 'Excel spawned PowerShell' }),
    JSON.stringify({ id: 'DNS-305', severity: 'MEDIUM', entity: host, source: 'dns', title: 'Periodic external lookup' }),
    JSON.stringify({ id: 'BACKUP-044', severity: 'HIGH', entity: 'SRV-BACKUP-02', source: 'backup', title: 'Large nightly transfer' }),
  ].join('\n');

  const mail = [
    `From: Vendor Billing <invoice@${senderDomain}>`,
    `To: ${user}@sfera.local`,
    'Subject: Изменение реквизитов',
    'Authentication-Results: spf=fail dkim=none dmarc=fail',
    `Received: from mx.${senderDomain} by mail.sfera.local`,
    'Content-Disposition: attachment; filename="payment_notice.xlsm"',
  ].join('\n');

  const processes = [
    'TIME,HOST,USER,PID,PPID,IMAGE,PARENT,COMMAND',
    `13:10:11,${host},SFERA\\${user},4012,2100,excel.exe,explorer.exe,"excel.exe payment_notice.xlsm"`,
    `13:10:14,${host},SFERA\\${user},${pid},4012,powershell.exe,excel.exe,"powershell.exe -NoProfile -EncodedCommand QABBAFkA"`,
    `13:10:28,${host},SFERA\\${user},${pid + 1},${pid},rundll32.exe,powershell.exe,"rundll32.exe C:\\Users\\Public\\cache.dll,Start"`,
    '13:12:00,OPS-WS-02,SYSTEM,920,700,svchost.exe,services.exe,"svchost.exe -k netsvcs"',
  ].join('\n');

  const dns = [
    'TIME,SRC,DOMAIN,RESULT',
    `13:11:02,10.50.8.44,${beaconDomain},NOERROR`,
    `13:12:03,10.50.8.44,${beaconDomain},NOERROR`,
    `13:13:01,10.50.8.44,${beaconDomain},NOERROR`,
    `13:14:04,10.50.8.44,${beaconDomain},NOERROR`,
    `13:15:02,10.50.8.44,${beaconDomain},NOERROR`,
    '13:15:30,10.50.8.12,updates.vendor.local,NOERROR',
  ].join('\n');

  const identity = [
    `12:40:00,SUCCESS,${user},10.50.8.44,managed-device,mfa-satisfied`,
    `13:06:00,SESSION_REFRESH,${user},10.50.8.44,managed-device,existing-session`,
    `13:16:00,FAILURE,${user},198.51.100.81,unknown-device,mfa-required`,
  ].join('\n');

  const assets = [
    'HOST,IP,OWNER,CRITICALITY',
    `${host},10.50.8.44,${user},HIGH`,
    'OPS-WS-02,10.50.8.12,operations,MEDIUM',
    'SRV-BACKUP-02,10.50.1.20,infrastructure,HIGH',
  ].join('\n');

  const backup = [
    'JOB=nightly-finance-backup',
    'HOST=SRV-BACKUP-02',
    'SCHEDULE=02:00-03:30',
    'STATUS=SUCCESS',
    'DESTINATION=10.50.1.30',
    'BYTES=8421930041',
    'CHANGE_TICKET=CHG-2041',
  ].join('\n');

  const shell: CaseEnvironment = {
    seed,
    home,
    directories: [
      '/', '/home', '/home/ilya', '/home/ilya/sfera', home,
      `${home}/telemetry`, `${home}/mail`, `${home}/endpoint`, `${home}/network`, `${home}/identity`, `${home}/inventory`, `${home}/backup`, `${home}/work`,
    ],
    files: {
      [`${home}/shift-brief.txt`]: { path: `${home}/shift-brief.txt`, artifactId: 'artifact.shift.brief', content: 'Четыре сигнала. Один легитимный. Определи цепочку, scope и первое действие без подсказок.' },
      [`${home}/telemetry/alerts.jsonl`]: { path: `${home}/telemetry/alerts.jsonl`, artifactId: 'artifact.shift.alerts', content: alerts },
      [`${home}/mail/payment_notice.eml`]: { path: `${home}/mail/payment_notice.eml`, artifactId: 'artifact.shift.mail', content: mail },
      [`${home}/endpoint/processes.csv`]: { path: `${home}/endpoint/processes.csv`, artifactId: 'artifact.shift.processes', content: processes },
      [`${home}/network/dns.log`]: { path: `${home}/network/dns.log`, artifactId: 'artifact.shift.dns', content: dns },
      [`${home}/identity/identity.log`]: { path: `${home}/identity/identity.log`, artifactId: 'artifact.shift.auth', content: identity },
      [`${home}/inventory/assets.csv`]: { path: `${home}/inventory/assets.csv`, artifactId: 'artifact.shift.assets', content: assets },
      [`${home}/backup/backup-job.log`]: { path: `${home}/backup/backup-job.log`, artifactId: 'artifact.shift.backup', content: backup },
    },
    processOutput: processes.split('\n'),
    networkOutput: dns.split('\n'),
    facts: { host, user, senderDomain, beaconDomain, pid, remote },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if (text.includes(senderDomain) && text.includes('dmarc=fail')) return 'shift-mail-finding';
      if (text.includes(host) && text.includes(String(pid)) && text.includes('excel.exe') && text.includes('powershell.exe')) return 'shift-process-chain';
      if (text.includes(beaconDomain) && text.includes('10.50.8.44') && (tools.includes('grep') || tools.includes('uniq') || tools.includes('wc'))) return 'shift-dns-correlation';
      if (text.includes(user) && text.includes('mfa-required') && text.includes('existing-session')) return 'shift-auth-scope';
      if (text.includes('nightly-finance-backup') && text.includes('CHANGE_TICKET=CHG-2041') && text.includes('STATUS=SUCCESS')) return 'shift-backup-legitimate';
      return undefined;
    },
  };

  const queue: SocQueueItem[] = [
    { id: 'MAIL-612', time: '13:08', severity: 'HIGH', title: 'Письмо с новым доменом', entity: user, summary: 'Вложение XLSM, DMARC fail, бухгалтерия.', artifactId: 'artifact.shift.mail', finding: 'shift-queue-mail', source: 'MAIL GATEWAY' },
    { id: 'EDR-812', time: '13:10', severity: 'CRITICAL', title: 'Excel → PowerShell', entity: host, summary: 'Office process spawned encoded PowerShell and rundll32.', artifactId: 'artifact.shift.processes', finding: 'shift-queue-endpoint', source: 'EDR' },
    { id: 'DNS-305', time: '13:11', severity: 'MEDIUM', title: 'Периодический DNS', entity: host, summary: 'Повторяющийся внешний домен с одного workstation.', artifactId: 'artifact.shift.dns', finding: 'shift-queue-dns', source: 'DNS' },
    { id: 'BACKUP-044', time: '02:14', severity: 'HIGH', title: 'Большая передача данных', entity: 'SRV-BACKUP-02', summary: 'Ночной объём выше baseline. Есть change ticket.', artifactId: 'artifact.shift.backup', finding: 'shift-queue-backup', source: 'BACKUP' },
  ];

  return { shell, queue };
}
