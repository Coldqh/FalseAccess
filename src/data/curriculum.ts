import type { LearningEvidenceLevel } from './learningStandards';

export interface CurriculumSource {
  id: string;
  authority: string;
  title: string;
  version: string;
  scope: string;
  assessment: string;
}

export interface CurriculumModule {
  id: string;
  title: string;
  level: 'FOUNDATION' | 'MODULE I' | 'MODULE II' | 'CAPSTONE';
  statusKey?: string;
  completionId?: string;
  topics: string[];
  mappings: string[];
  evidenceLevel: LearningEvidenceLevel;
  limitation: string;
}

export const curriculumSources: CurriculumSource[] = [
  { id: 'cs50', authority: 'Harvard / CS50', title: "Introduction to Cybersecurity", version: 'OCW 2026', scope: 'Accounts, data, systems, software, privacy и risk trade-offs', assessment: 'Задания и итоговый проект вместо одного quiz.' },
  { id: 'stanford', authority: 'Stanford', title: 'CS155 Computer and Network Security', version: 'Spring 2026', scope: 'System, web, crypto, network, supply chain и secure design', assessment: 'Кодовые проекты по system, web и network security.' },
  { id: 'berkeley', authority: 'UC Berkeley', title: 'CS161 Computer Security', version: 'Spring 2026', scope: 'Security principles, memory, crypto, web и сети', assessment: 'Три проекта, checkpoints и hidden autograder tests.' },
  { id: 'portswigger', authority: 'PortSwigger', title: 'Web Security Academy', version: 'Living curriculum 2026', scope: 'Исполняемые web-labs, recon и mystery challenges', assessment: 'Уязвимость нужно найти и подтвердить в работающем стенде.' },
  { id: 'nice', authority: 'NIST NICE', title: 'Workforce Framework Components', version: '2.2.0 · 2026', scope: 'Tasks, Knowledge, Skills, work roles и competency areas', assessment: 'Навык оценивается через наблюдаемое выполнение задачи.' },
  { id: 'ir', authority: 'NIST', title: 'Incident Response Recommendations', version: 'SP 800-61r3 · 2025', scope: 'Preparation, detection, response, recovery и risk management', assessment: 'Evidence, scope, impact, decisions и recovery validation.' },
  { id: 'owasp-web', authority: 'OWASP', title: 'WSTG / API Security', version: 'Current · 2026', scope: 'Web, API, authorization, input validation и testing', assessment: 'Проверка trust boundaries и server-side controls.' },
  { id: 'owasp-mobile', authority: 'OWASP', title: 'MASVS / MASTG', version: 'Current · 2026', scope: 'Mobile storage, platform, network и resilience', assessment: 'Проверка приложения, устройства и backend как одной системы.' },
  { id: 'sc200', authority: 'Microsoft Learn', title: 'SC-200 Security Operations Analyst', version: 'Skills · 16 Apr 2026', scope: 'SOC environment, incident response, threat hunting и detections', assessment: 'Ролевые задачи в SIEM/XDR и KQL.' },
  { id: 'attack', authority: 'MITRE', title: 'ATT&CK Enterprise', version: 'Current · 2026', scope: 'TTP mapping и detection context', assessment: 'Mapping не считается доказательством без telemetry.' },
  { id: 'cis', authority: 'CIS', title: 'Critical Security Controls', version: '8.1', scope: 'Практический минимум защиты организации', assessment: 'Controls должны иметь owner, evidence и проверяемый результат.' },
  { id: 'ssdf', authority: 'NIST', title: 'Secure Software Development Framework', version: 'SP 800-218', scope: 'Secure SDLC, provenance и DevSecOps', assessment: 'Проверяемые build, dependency и release controls.' },
] as const;

export const curriculumModules: CurriculumModule[] = [
  { id: 'foundation-0', title: 'Stage 0 · Absolute Zero', level: 'FOUNDATION', completionId: 'foundation-0', topics: ['hardware', 'OS', 'files', 'processes', 'hashes', 'Git'], mappings: ['CS50', 'NICE foundational TKS'], evidenceLevel: 'guided-practice', limitation: 'Синтетический shell; не подтверждает владение ОС.' },
  { id: 'foundation-1', title: 'Stage 1 · IT Foundation', level: 'FOUNDATION', completionId: 'foundation-1', topics: ['Windows', 'Linux', 'services', 'TCP/IP', 'DNS', 'HTTP/TLS'], mappings: ['CS155 prerequisites', 'NICE systems/network operations'], evidenceLevel: 'guided-practice', limitation: 'Нет реальной настройки систем и packet capture.' },
  { id: 'foundation-2', title: 'Stage 2 · Junior SOC Foundation', level: 'FOUNDATION', completionId: 'foundation-2', topics: ['SIEM', 'EDR', 'triage', 'scope', 'evidence', 'containment'], mappings: ['NIST SP 800-61r3', 'SC-200', 'NICE'], evidenceLevel: 'guided-practice', limitation: 'Не является подтверждением готовности к должности.' },
  { id: 'foundation-3', title: 'Stage 3 · Automation & Web Foundation', level: 'FOUNDATION', completionId: 'foundation-3', topics: ['Python', 'Bash', 'PowerShell', 'JSON', 'HTTP/API', 'SQL'], mappings: ['Berkeley hidden-test model', 'PortSwigger', 'OWASP'], evidenceLevel: 'guided-practice', limitation: 'Код пока не исполняется на hidden tests.' },
  { id: 'windows-i', title: 'Windows Workstation', level: 'MODULE I', statusKey: 'windowsCaseComplete', topics: ['4688', 'process tree', 'PowerShell', 'autorun', 'network'], mappings: ['NICE incident analysis', 'ATT&CK Execution/Persistence'], evidenceLevel: 'independent-practice', limitation: 'Prepared snapshot вместо настоящего endpoint.' },
  { id: 'linux-i', title: 'Linux Server', level: 'MODULE I', statusKey: 'linuxCaseComplete', topics: ['SSH', 'sudo', 'systemd', 'cron', 'Bash'], mappings: ['NICE systems security', 'ATT&CK Unix shell/account access'], evidenceLevel: 'independent-practice', limitation: 'Нет реальной VM и permission failures.' },
  { id: 'network-i', title: 'Office Network', level: 'MODULE I', statusKey: 'networkCaseComplete', topics: ['DHCP', 'DNS', 'NAT', 'VLAN', 'TCP'], mappings: ['CIS Network Infrastructure', 'CS155 network security'], evidenceLevel: 'independent-practice', limitation: 'Нет PCAP, Wireshark и живой маршрутизации.' },
  { id: 'web-i', title: 'Web / API / SQL', level: 'MODULE I', statusKey: 'webCaseComplete', topics: ['sessions', 'BOLA', 'authorization', 'SQL'], mappings: ['OWASP API1', 'PortSwigger access control'], evidenceLevel: 'independent-practice', limitation: 'Один класс уязвимости; API не исполняется.' },
  { id: 'mobile-i', title: 'Mobile Security', level: 'MODULE I', statusKey: 'mobileCaseComplete', topics: ['permissions', 'profiles', 'tokens', 'Keystore'], mappings: ['OWASP MASVS Storage/Platform'], evidenceLevel: 'independent-practice', limitation: 'Нет настоящего APK/IPA и device instrumentation.' },
  { id: 'ad-i', title: 'Active Directory', level: 'MODULE I', statusKey: 'adCaseComplete', topics: ['Kerberos', 'GPO', 'SYSVOL', 'service accounts'], mappings: ['ATT&CK Valid Accounts/Domain Policy'], evidenceLevel: 'independent-practice', limitation: 'Нет настоящего домена и ACL enforcement.' },
  { id: 'mail-i', title: 'Mail Security', level: 'MODULE I', statusKey: 'mailCaseComplete', topics: ['SPF', 'DKIM', 'DMARC', 'OAuth', 'mail rules'], mappings: ['ATT&CK Phishing', 'CIS Email Protections'], evidenceLevel: 'independent-practice', limitation: 'Prepared messages; нет настоящего mail gateway.' },
  { id: 'dfir-i', title: 'Disk & Memory Forensics', level: 'MODULE I', statusKey: 'forensicsCaseComplete', topics: ['E01', 'timeline', 'deleted files', 'Volatility'], mappings: ['NICE Digital Evidence Analysis'], evidenceLevel: 'independent-practice', limitation: 'Выводы инструментов заранее подготовлены.' },
  { id: 'ir-i', title: 'Incident Response', level: 'MODULE I', statusKey: 'incidentCaseComplete', topics: ['triage', 'scope', 'containment', 'eradication', 'recovery'], mappings: ['NIST SP 800-61r3'], evidenceLevel: 'independent-practice', limitation: 'Нет реального coordination pressure и stakeholders.' },
  { id: 'hunt-ii', title: 'Threat Hunting & Detection', level: 'MODULE II', statusKey: 'huntCaseComplete', topics: ['hypotheses', 'telemetry gaps', 'Sigma', 'KQL', 'tuning'], mappings: ['SC-200 hunting', 'MITRE TTP-based hunting'], evidenceLevel: 'independent-practice', limitation: 'KQL/Sigma не запускаются на большом dataset.' },
  { id: 'crypto-ii', title: 'Cryptography, PKI & Malware', level: 'MODULE II', statusKey: 'cryptoCaseComplete', topics: ['hashing', 'signatures', 'TLS', 'PE/ELF', 'YARA'], mappings: ['CS155 crypto/TLS', 'NICE Cryptography'], evidenceLevel: 'independent-practice', limitation: 'Нет dynamic analysis и clean corpus testing.' },
  { id: 'cloud-ii', title: 'Cloud Security', level: 'MODULE II', statusKey: 'cloudCaseComplete', topics: ['IAM', 'temporary credentials', 'storage', 'KMS', 'CloudTrail'], mappings: ['NIST Zero Trust', 'cloud IAM practices'], evidenceLevel: 'independent-practice', limitation: 'Synthetic provider; policy не применяется к tenant.' },
  { id: 'supply-ii', title: 'Containers & Supply Chain', level: 'MODULE II', statusKey: 'supplyCaseComplete', topics: ['Docker', 'Kubernetes', 'CI/CD', 'SBOM', 'provenance'], mappings: ['NIST SSDF', 'SLSA', 'Kubernetes security'], evidenceLevel: 'independent-practice', limitation: 'Manifest пока проверяется статически.' },
  { id: 'architecture-ii', title: 'Security Engineering', level: 'MODULE II', statusKey: 'architectureCaseComplete', topics: ['Zero Trust', 'vulnerability management', 'RTO/RPO', 'risk', 'budget'], mappings: ['NIST CSF/Zero Trust', 'CIS Controls'], evidenceLevel: 'independent-practice', limitation: 'Решения не проходят external architecture review.' },
  { id: 'enterprise-capstone', title: 'Independent Enterprise Incident', level: 'CAPSTONE', statusKey: 'capstoneCaseComplete', topics: ['unknown path', 'multiple systems', 'business impact', 'report'], mappings: ['NICE cross-role tasks', 'NIST SP 800-61r3'], evidenceLevel: 'independent-practice', limitation: 'Путь свободный, но artifacts всё ещё заранее конечны.' },
];
