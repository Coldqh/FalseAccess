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

export interface Act1ContractBundle {
  title: string;
  client: string;
  pay: number;
  objective: string;
  shell: CaseEnvironment;
  evidenceSuggestion: { claimId: string; evidenceId: string; label: string; note: string };
}

export function createAct1ContractEnvironment(missionId: string, seed: number): Act1ContractBundle {
  const random = rng(seed);
  const home = `/home/ilya/sfera/contracts/${missionId}`;

  if (missionId === 'act1-contract-mail') {
    const senderDomain = pick(random, ['vendor-payments.co', 'invoice-support.net', 'sfera-vendor.org']);
    const recipientCount = Math.floor(random() * 3) + 2;
    const recipients = ['a.krylova', 'm.rybina', 'v.antonov', 'e.sazonov'].slice(0, recipientCount);
    const eml = [
      `From: Vendor Billing <billing@${senderDomain}>`,
      'Subject: Срочная смена реквизитов',
      'Authentication-Results: spf=fail dkim=none dmarc=fail',
      `Received: from mx.${senderDomain} by mail.sfera.local`,
      'Content-Disposition: attachment; filename="bank_details.docm"',
    ].join('\n');
    const trace = ['recipient,status'].concat(recipients.map((recipient) => `${recipient}@sfera.local,DELIVERED`), ['archive@sfera.local,QUARANTINED']).join('\n');
    const shell: CaseEnvironment = {
      seed, home,
      directories: ['/', '/home', '/home/ilya', '/home/ilya/sfera', '/home/ilya/sfera/contracts', home, `${home}/mail`, `${home}/work`],
      files: {
        [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.act1.mail.brief', content: 'Определи подозрительный домен и число доставленных копий. Ручной ответ не считается.' },
        [`${home}/mail/invoice_change.eml`]: { path: `${home}/mail/invoice_change.eml`, artifactId: 'artifact.act1.mail.eml', content: eml },
        [`${home}/mail/recipients.csv`]: { path: `${home}/mail/recipients.csv`, artifactId: 'artifact.act1.mail.recipients', content: trace },
      },
      facts: { senderDomain, recipientCount },
      detectFinding: ({ raw, stdout, tools }) => {
        const text = `${raw}\n${stdout.join('\n')}`;
        const hasDomain = text.includes(senderDomain);
        const hasCount = text.includes(String(recipientCount));
        if (hasDomain && hasCount && tools.includes('grep')) return 'act1-mail-domain-scope';
        return undefined;
      },
    };
    return {
      shell,
      title: 'Письмо поставщику',
      client: 'СФЕРА / Service Desk',
      pay: 1900,
      objective: 'Самостоятельно подтвердить домен и масштаб доставки.',
      evidenceSuggestion: { claimId: 'outcome.act1.mail', evidenceId: 'artifact.act1.mail.eml', label: 'Связать raw EML', note: 'Домен и authentication results получены из raw source.' },
    };
  }

  if (missionId === 'act1-contract-endpoint') {
    const host = pick(random, ['OPS-WS-11', 'FIN-WS-09', 'HR-WS-15']);
    const pid = Math.floor(random() * 900) + 5100;
    const remote = `198.51.100.${Math.floor(random() * 170) + 20}`;
    const processes = [
      'HOST,USER,PID,PPID,IMAGE,PARENT,COMMAND',
      `${host},SFERA\\operator,3120,2100,excel.exe,explorer.exe,"excel.exe report.xlsm"`,
      `${host},SFERA\\operator,${pid},3120,powershell.exe,excel.exe,"powershell.exe -NoProfile -EncodedCommand QQBCAEMA"`,
      'PRINT-03,SYSTEM,901,700,spoolsv.exe,services.exe,"spoolsv.exe"',
    ].join('\n');
    const network = [
      'HOST,PID,REMOTE,STATE',
      `${host},${pid},${remote}:443,ESTAB`,
      'PRINT-03,901,10.10.1.20:9100,ESTAB',
    ].join('\n');
    const shell: CaseEnvironment = {
      seed, home,
      directories: ['/', '/home', '/home/ilya', '/home/ilya/sfera', '/home/ilya/sfera/contracts', home, `${home}/endpoint`, `${home}/work`],
      files: {
        [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.act1.endpoint.brief', content: 'Свяжи parent, child, PID, host и remote. Не называй процесс вредоносным только по имени.' },
        [`${home}/endpoint/processes.csv`]: { path: `${home}/endpoint/processes.csv`, artifactId: 'artifact.act1.endpoint.processes', content: processes },
        [`${home}/endpoint/connections.csv`]: { path: `${home}/endpoint/connections.csv`, artifactId: 'artifact.act1.endpoint.network', content: network },
      },
      processOutput: processes.split('\n'),
      networkOutput: network.split('\n'),
      facts: { host, pid, remote },
      detectFinding: ({ raw, stdout, tools }) => {
        const text = `${raw}\n${stdout.join('\n')}`;
        if (text.includes(host) && text.includes(String(pid)) && text.includes(remote) && (tools.includes('grep') || tools.includes('ps') || tools.includes('ss'))) return 'act1-endpoint-chain-remote';
        return undefined;
      },
    };
    return {
      shell,
      title: 'Необычная process chain',
      client: 'СФЕРА / Endpoint Queue',
      pay: 2400,
      objective: 'Самостоятельно связать process chain с сетевым соединением.',
      evidenceSuggestion: { claimId: 'outcome.act1.endpoint', evidenceId: 'artifact.act1.endpoint.processes', label: 'Связать process snapshot', note: 'Parent, child, PID и host получены из EDR snapshot.' },
    };
  }

  const hostIp = `10.44.${Math.floor(random() * 10) + 2}.${Math.floor(random() * 180) + 20}`;
  const host = pick(random, ['CASH-02', 'DISPATCH-04', 'OFFICE-17']);
  const domain = pick(random, ['sync-profile-node.test', 'cdn-health-cache.test', 'telemetry-edge-check.test']);
  const count = Math.floor(random() * 5) + 6;
  const dnsLines = [
    'time,src,domain,result',
    '07:10:02,10.44.2.10,updates.vendor.local,NOERROR',
    ...Array.from({ length: count }, (_, index) => `07:${String(20 + index).padStart(2, '0')}:1${index % 10},${hostIp},${domain},NOERROR`),
    '07:40:03,10.44.2.1,ntp.sfera.local,NOERROR',
  ];
  const assets = ['IP,HOST,OWNER', `${hostIp},${host},branch-office`, '10.44.2.10,MANAGER-01,branch-manager'].join('\n');
  const shell: CaseEnvironment = {
    seed, home,
    directories: ['/', '/home', '/home/ilya', '/home/ilya/sfera', '/home/ilya/sfera/contracts', home, `${home}/network`, `${home}/inventory`, `${home}/work`],
    files: {
      [`${home}/brief.txt`]: { path: `${home}/brief.txt`, artifactId: 'artifact.act1.dns.brief', content: 'Определи host, domain и воспроизводимый count. Один редкий запрос не считается ритмом.' },
      [`${home}/network/dns.log`]: { path: `${home}/network/dns.log`, artifactId: 'artifact.act1.dns.log', content: dnsLines.join('\n') },
      [`${home}/inventory/assets.csv`]: { path: `${home}/inventory/assets.csv`, artifactId: 'artifact.act1.dns.assets', content: assets },
    },
    facts: { hostIp, host, domain, count },
    detectFinding: ({ raw, stdout, tools }) => {
      const text = `${raw}\n${stdout.join('\n')}`;
      if (text.includes(hostIp) && text.includes(domain) && text.includes(String(count)) && (tools.includes('grep') || tools.includes('uniq') || tools.includes('wc'))) return 'act1-dns-host-domain-count';
      return undefined;
    },
  };
  return {
    shell,
    title: 'DNS-ритм филиала',
    client: 'СФЕРА / Network Queue',
    pay: 2200,
    objective: 'Самостоятельно получить host, domain и count.',
    evidenceSuggestion: { claimId: 'outcome.act1.dns', evidenceId: 'artifact.act1.dns.log', label: 'Связать DNS telemetry', note: 'Хост, домен и count получены из resolver log.' },
  };
}
