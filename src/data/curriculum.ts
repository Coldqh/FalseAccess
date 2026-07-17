export interface CurriculumSource {
  id: string;
  authority: string;
  title: string;
  version: string;
  scope: string;
}

export interface CurriculumModule {
  id: string;
  title: string;
  level: 'MODULE I' | 'MODULE II' | 'CAPSTONE';
  statusKey?: string;
  topics: string[];
  mappings: string[];
}

export const curriculumSources: CurriculumSource[] = [
  { id: 'nice', authority: 'NIST', title: 'NICE Workforce Framework', version: 'Components 2.2.0', scope: 'Задачи, знания и навыки специалиста' },
  { id: 'attack', authority: 'MITRE', title: 'ATT&CK Enterprise', version: 'Current', scope: 'TTP, охота и аналитики обнаружения' },
  { id: 'cis', authority: 'CIS', title: 'Critical Security Controls', version: '8.1', scope: 'Практический минимум защиты организации' },
  { id: 'ir', authority: 'NIST', title: 'Incident Response Recommendations', version: 'SP 800-61r3', scope: 'Подготовка, response и восстановление' },
  { id: 'owasp-web', authority: 'OWASP', title: 'WSTG / API Security', version: 'Current', scope: 'Web, API, авторизация и тестирование' },
  { id: 'owasp-mobile', authority: 'OWASP', title: 'MASVS / MASTG', version: 'Current', scope: 'Мобильная платформа и хранение секретов' },
  { id: 'ssdf', authority: 'NIST', title: 'Secure Software Development Framework', version: 'SP 800-218', scope: 'Secure SDLC и DevSecOps' },
  { id: 'tls', authority: 'NIST', title: 'TLS Configuration Guidance', version: 'SP 800-52r2', scope: 'TLS, сертификаты и криптографическая конфигурация' },
] as const;

export const curriculumModules: CurriculumModule[] = [
  { id: 'windows-i', title: 'Windows Workstation', level: 'MODULE I', statusKey: 'windowsCaseComplete', topics: ['4688', 'process tree', 'PowerShell', 'autorun', 'network'], mappings: ['NICE: incident analysis', 'ATT&CK: Execution / Persistence'] },
  { id: 'linux-i', title: 'Linux Server', level: 'MODULE I', statusKey: 'linuxCaseComplete', topics: ['SSH', 'sudo', 'systemd', 'cron', 'Bash'], mappings: ['NICE: systems security', 'ATT&CK: Unix shell / account access'] },
  { id: 'network-i', title: 'Office Network', level: 'MODULE I', statusKey: 'networkCaseComplete', topics: ['DHCP', 'DNS', 'NAT', 'VLAN', 'TCP'], mappings: ['CIS: Network Infrastructure', 'NICE: network operations'] },
  { id: 'web-i', title: 'Web / API / SQL', level: 'MODULE I', statusKey: 'webCaseComplete', topics: ['sessions', 'BOLA', 'authorization', 'SQL'], mappings: ['OWASP API1', 'OWASP WSTG Authorization'] },
  { id: 'mobile-i', title: 'Mobile Security', level: 'MODULE I', statusKey: 'mobileCaseComplete', topics: ['permissions', 'profiles', 'tokens', 'Keystore'], mappings: ['OWASP MASVS Storage / Platform'] },
  { id: 'ad-i', title: 'Active Directory', level: 'MODULE I', statusKey: 'adCaseComplete', topics: ['Kerberos', 'GPO', 'SYSVOL', 'service accounts'], mappings: ['ATT&CK: Valid Accounts / Domain Policy'] },
  { id: 'mail-i', title: 'Mail Security', level: 'MODULE I', statusKey: 'mailCaseComplete', topics: ['SPF', 'DKIM', 'DMARC', 'OAuth', 'mail rules'], mappings: ['ATT&CK: Phishing', 'CIS: Email and Browser Protections'] },
  { id: 'dfir-i', title: 'Disk & Memory Forensics', level: 'MODULE I', statusKey: 'forensicsCaseComplete', topics: ['E01', 'timeline', 'deleted files', 'Volatility'], mappings: ['NICE: Digital Evidence Analysis'] },
  { id: 'ir-i', title: 'Incident Response', level: 'MODULE I', statusKey: 'incidentCaseComplete', topics: ['triage', 'scope', 'containment', 'eradication', 'recovery'], mappings: ['NIST SP 800-61r3'] },
  { id: 'hunt-ii', title: 'Threat Hunting & Detection', level: 'MODULE II', statusKey: 'huntCaseComplete', topics: ['hypotheses', 'telemetry gaps', 'Sigma', 'KQL', 'tuning'], mappings: ['MITRE TTP-based Hunting'] },
  { id: 'crypto-ii', title: 'Cryptography, PKI & Malware', level: 'MODULE II', statusKey: 'cryptoCaseComplete', topics: ['hashing', 'signatures', 'TLS', 'PE/ELF', 'YARA'], mappings: ['NIST Cryptographic Standards', 'NICE Cryptography'] },
  { id: 'cloud-ii', title: 'Cloud Security', level: 'MODULE II', statusKey: 'cloudCaseComplete', topics: ['IAM', 'temporary credentials', 'storage', 'KMS', 'CloudTrail'], mappings: ['AWS IAM Best Practices', 'NIST SP 800-207'] },
  { id: 'supply-ii', title: 'Containers & Supply Chain', level: 'MODULE II', statusKey: 'supplyCaseComplete', topics: ['Docker', 'Kubernetes', 'CI/CD', 'SBOM', 'provenance'], mappings: ['NIST SSDF', 'SLSA', 'Kubernetes Security Checklist'] },
  { id: 'architecture-ii', title: 'Security Engineering', level: 'MODULE II', statusKey: 'architectureCaseComplete', topics: ['Zero Trust', 'vulnerability management', 'RTO/RPO', 'risk', 'budget'], mappings: ['NIST SP 800-207', 'CIS Controls 8.1'] },
  { id: 'enterprise-capstone', title: 'Independent Enterprise Incident', level: 'CAPSTONE', statusKey: 'capstoneCaseComplete', topics: ['unknown path', 'multiple systems', 'business impact', 'report'], mappings: ['NICE cross-role validation', 'NIST SP 800-61r3'] },
];
