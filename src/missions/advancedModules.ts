export interface CaseOption { id: string; text: string; correct?: boolean }
export interface CaseQuestion { id: string; label: string; options: CaseOption[] }
export interface CaseCommand { id: string; title: string; theory: string; command: string; match: string[]; output: string }
export interface CaseReportSection { id: string; label: string; options: CaseOption[] }

export interface AdvancedModuleConfig {
  prefix: 'cloudCase' | 'supplyCase' | 'architectureCase' | 'capstoneCase';
  caseId: string;
  title: string;
  subtitle: string;
  brief: string;
  contact: string;
  environment: string;
  stageNames: string[];
  concepts: Array<{ title: string; text: string }>;
  architecture: Array<{ role: string; title: string; detail: string }>;
  foundation: CaseQuestion[];
  commands: CaseCommand[];
  guidedAnyOrder?: boolean;
  patchTitle: string;
  patchTheory: string;
  vulnerablePatch: string;
  securePatch: string;
  requiredPatterns: string[];
  forbiddenPatterns: string[];
  independentCommands: CaseCommand[];
  independentQuestions: CaseQuestion[];
  reports: CaseReportSection[];
  sources: string[];
}

const q = (id: string, label: string, options: Array<[string, string, boolean?]>): CaseQuestion => ({
  id, label, options: options.map(([optionId, text, correct]) => ({ id: optionId, text, correct })),
});

export const cloudModule: AdvancedModuleConfig = {
  prefix: 'cloudCase', caseId: 'SKYVAULT-12', title: 'Cloud Security', subtitle: 'IAM / STORAGE / KMS / AUDIT',
  brief: 'Сборочный runner получил долгоживущий ключ. Через него читали закрытый bucket и создавали новые KMS grants. Есть копия аккаунта и CloudTrail.',
  contact: 'Ключ уже отключён. Нужны реальный scope, путь доступа и новая модель прав. Не делай вывод по одному public-флагу.',
  environment: 'SYNTHETIC CLOUD TENANT / NO LIVE ACCOUNTS',
  stageNames: ['Вводная', 'Основа', 'CloudTrail', 'IAM policy', 'Второй аккаунт', 'Отчёт', 'Готово'],
  concepts: [
    { title: 'IDENTITY', text: 'Права выдаются пользователю или workload-identity, а не IP-адресу.' },
    { title: 'TEMP CREDS', text: 'Роли и короткоживущие токены уменьшают срок жизни украденного секрета.' },
    { title: 'LEAST PRIVILEGE', text: 'Разрешаются только нужные действия над конкретными ресурсами и при нужных условиях.' },
    { title: 'AUDIT', text: 'CloudTrail показывает вызовы API, principal, source, resource и результат.' },
    { title: 'KMS', text: 'Шифрование не спасает, если identity имеет decrypt или может выдать себе grant.' },
  ],
  architecture: [
    { role: 'IDENTITY', title: 'build-runner', detail: 'Long-lived access key' },
    { role: 'COMPUTE', title: 'runner-02', detail: 'CI workload' },
    { role: 'STORAGE', title: 'artifacts-prod', detail: 'Private object storage' },
    { role: 'KEYS', title: 'kms/artifacts', detail: 'Envelope encryption' },
    { role: 'LOGS', title: 'CloudTrail', detail: 'Management + data events' },
  ],
  foundation: [
    q('role', 'Почему workload должен получать роль, а не постоянный access key?', [['a','Роль выдаёт временные credentials с ограниченным сроком',true],['b','Роль скрывает все действия из журналов'],['c','Роль автоматически делает workload администратором']]),
    q('bucket', 'Bucket private. Значит ли это, что данные нельзя прочитать?', [['a','Да, private полностью исключает утечку'],['b','Нет, identity policy или cross-account access всё равно могут разрешить чтение',true],['c','Нет, потому что TLS отключает ACL']]),
    q('kms', 'Что доказывает успешный Decrypt в audit log?', [['a','Ключ был взломан математически'],['b','Конкретный principal получил разрешённую операцию decrypt',true],['c','Все объекты bucket публичны']]),
    q('scope', 'Что нужно для scope?', [['a','Только список IP'],['b','Principal, API calls, resources, time и downstream sessions',true],['c','Только размер исходящего трафика']]),
  ],
  commands: [
    { id:'identity', title:'Проверь identity runner', theory:'Сначала выясни, кто именно подписывал запросы и какие credentials использовались.', command:'cloudctl iam identity build-runner', match:['cloudctl','iam','build-runner'], output:'principal=role/build-runner\ncredential=access-key AKIA...91Q\ncreated=143 days ago\nlast_used=02:14Z\nwarning=long_lived' },
    { id:'trail', title:'Найди вызовы API', theory:'Audit log связывает principal, действие, ресурс и источник.', command:'cloudctl trail lookup --principal build-runner --since 02:00Z', match:['trail','build-runner','02:00'], output:'02:14 AssumeRole FAILED source=198.51.100.44\n02:16 GetObject artifacts-prod/payments.csv SUCCESS\n02:18 CreateGrant kms/artifacts SUCCESS\n02:21 GetObject artifacts-prod/routes.json SUCCESS' },
    { id:'storage', title:'Проверь policy bucket', theory:'Private ACL не отменяет разрешения IAM и cross-account policies.', command:'cloudctl storage policy artifacts-prod', match:['storage','policy','artifacts-prod'], output:'acl=private\npolicy allows role/build-runner: storage:GetObject resource=artifacts-prod/*\ncondition=none' },
    { id:'kms', title:'Проверь KMS grants', theory:'Новый grant может пережить удаление исходной policy и сохранить decrypt-доступ.', command:'cloudctl kms grants list kms/artifacts', match:['kms','grants','artifacts'], output:'grant g-17 principal=role/build-runner ops=Decrypt created=02:18Z\ngrant g-02 principal=role/backup ops=Encrypt,Decrypt approved=true' },
    { id:'metadata', title:'Проверь metadata protection', theory:'IMDSv2/аналог требует session token и снижает риск простого SSRF-кражи credentials.', command:'cloudctl compute metadata runner-02', match:['compute','metadata','runner-02'], output:'tokens=optional\nhop_limit=2\nrole=none\ncredentials_source=environment' },
  ],
  patchTitle: 'Замени постоянный ключ на workload role',
  patchTheory: 'Нужны temporary credentials, конкретные actions/resources, условия и запрет выдавать новые KMS grants.',
  vulnerablePatch: `{
  "Principal": "build-runner",
  "Credential": "long-lived-access-key",
  "Action": "*",
  "Resource": "*",
  "KmsGrant": true
}`,
  securePatch: `IDENTITY=workload temporary AssumeRole
MFA=true
ACTION=storage:GetObject
RESOURCE=artifacts-prod/*
KMS=kms:Decrypt
CONDITION=source-workload+session-tags
DENY=kms:CreateGrant`,
  requiredPatterns: ['temporary', 'assumerole', 'storage:getobject', 'artifacts-prod/', 'kms:decrypt', 'condition', 'mfa'],
  forbiddenPatterns: ['"action": "*"', '"resource": "*"', 'long-lived-access-key', 'kmsgrant": true'],
  independentCommands: [
    { id:'access-analyzer', title:'Проверь внешний доступ', theory:'Access analyzer ищет public и cross-account grants.', command:'cloudctl access-analyzer findings --account archive-lab', match:['access-analyzer','archive-lab'], output:'HIGH bucket=case-archive principal=account/991144 action=GetObject\nMEDIUM role=reporter unused_permissions=17' },
    { id:'unused', title:'Проверь неиспользуемые права', theory:'Last accessed помогает сужать policies после наблюдения.', command:'cloudctl iam last-accessed role/reporter', match:['last-accessed','reporter'], output:'used=logs:PutObject\nunused=storage:DeleteObject,kms:CreateGrant,iam:PassRole' },
    { id:'object-events', title:'Проверь data events', theory:'Management events не всегда содержат чтение объектов — нужны data events.', command:'cloudctl trail data-events --bucket case-archive', match:['data-events','case-archive'], output:'03:44 GetObject evidence.zip principal=account/991144 source=203.0.113.61' },
  ],
  independentQuestions: [
    q('external', 'Что подтверждено во втором аккаунте?', [['a','Внешний аккаунт прочитал evidence.zip',true],['b','Весь аккаунт полностью скомпрометирован'],['c','KMS был математически взломан']]),
    q('fix', 'Что исправить первым?', [['a','Удалить внешний grant и сузить role permissions',true],['b','Сделать bucket публичным'],['c','Выключить audit logs']]),
  ],
  reports: [
    q('root', 'Первопричина', [['a','Долгоживущий ключ и чрезмерные IAM/KMS права',true],['b','Private ACL'],['c','TLS 1.3']]),
    q('scope', 'Подтверждённый scope', [['a','Два объекта прочитаны, создан KMS grant',true],['b','Все облака организации уничтожены'],['c','Только неудачный вход']]),
    q('response', 'Ответ', [['a','Отозвать key/grant, перейти на role, сузить policy, включить data events',true],['b','Сменить имя bucket'],['c','Удалить CloudTrail']]),
  ],
  sources: ['AWS IAM Security Best Practices', 'NIST SP 800-207', 'CIS Controls 5/6/8'],
};

export const supplyModule: AdvancedModuleConfig = {
  prefix:'supplyCase', caseId:'CHAINBREAK-13', title:'Containers & Supply Chain', subtitle:'DOCKER / KUBERNETES / CI/CD / SBOM',
  brief:'В registry появился образ с правильным тегом, но другим digest. Pod получил cluster-admin и отправлял secrets наружу. Pipeline использует статический cloud key.',
  contact:'Не удаляй registry и cluster вслепую. Нужна цепочка build → image → deploy → service account → cloud.',
  environment:'SYNTHETIC REGISTRY + K8S CLUSTER',
  stageNames:['Вводная','Основа','Image/Cluster','Pipeline patch','Второй namespace','Отчёт','Готово'],
  concepts:[
    {title:'IMAGE',text:'Тег изменяем. Digest фиксирует конкретное содержимое образа.'},
    {title:'SBOM',text:'SBOM перечисляет компоненты и версии, но сам по себе не доказывает безопасность.'},
    {title:'SIGNING',text:'Подпись и provenance связывают artifact с доверенным build-процессом.'},
    {title:'RBAC',text:'ServiceAccount должен иметь только нужные verbs/resources в нужном namespace.'},
    {title:'OIDC',text:'CI получает короткоживущую роль по ограниченному trust policy вместо статического ключа.'},
  ],
  architecture:[
    {role:'SOURCE',title:'ledger-api',detail:'Git repository'},
    {role:'CI',title:'build.yml',detail:'OIDC disabled'},
    {role:'REGISTRY',title:'ledger-api:stable',detail:'Mutable tag'},
    {role:'CLUSTER',title:'payments-prod',detail:'Kubernetes'},
    {role:'IDENTITY',title:'ledger-runner',detail:'cluster-admin'},
  ],
  foundation:[
    q('digest','Почему deploy по digest безопаснее тега?',[['a','Digest фиксирует конкретный artifact',true],['b','Digest шифрует контейнер'],['c','Digest выдаёт cluster-admin']]),
    q('sbom','Что даёт SBOM?',[['a','Список компонентов и версий для анализа риска',true],['b','Гарантию отсутствия уязвимостей'],['c','Автоматический backup cluster']]),
    q('rbac','Какой RBAC нужен приложению?',[['a','Минимальные verbs/resources только в нужном namespace',true],['b','cluster-admin'],['c','Доступ ко всем secrets']]),
    q('secret','Где не хранить secret?',[['a','В image layer и plaintext CI variables',true],['b','Во внешнем secrets manager с workload identity'],['c','В runtime memory на время запроса']]),
  ],
  commands:[
    {id:'history',title:'Проверь image layers',theory:'Удаление файла в следующем layer не убирает его из предыдущего.',command:'docker history registry.local/ledger-api:stable',match:['docker','history','ledger-api'],output:'sha256:a91 COPY .env /app/.env\nsha256:b17 RUN rm /app/.env\nwarning=secret remains in layer a91'},
    {id:'sbom',title:'Собери SBOM',theory:'Состав artifact нужен для поиска уязвимых зависимостей и расследования.',command:'syft registry.local/ledger-api@sha256:bad91 -o table',match:['syft','sha256:bad91'],output:'openssl 3.0.7\nexpress 4.18.1\njsonwebtoken 8.5.1\nsource=image'},
    {id:'signature',title:'Проверь подпись и provenance',theory:'Valid signature должна соответствовать digest и доверенному issuer/workflow.',command:'cosign verify registry.local/ledger-api@sha256:bad91',match:['cosign','verify','sha256:bad91'],output:'verification=FAILED\nreason=no valid signature for digest\ntag stable previously pointed to sha256:good44'},
    {id:'rbac',title:'Проверь права ServiceAccount',theory:'Проверяй реальные effective permissions, а не только YAML role.',command:'kubectl auth can-i --as system:serviceaccount:payments:ledger-runner --list',match:['kubectl','auth','ledger-runner'],output:'*.* verbs=* scope=cluster\nsource=ClusterRoleBinding/ledger-admin'},
    {id:'audit',title:'Проверь audit log',theory:'Kubernetes audit связывает identity, verb, resource, namespace и source.',command:'kubectl audit search --user ledger-runner --since 03:00Z',match:['kubectl','audit','ledger-runner'],output:'03:12 list secrets namespace=*\n03:14 create pod namespace=kube-system\n03:17 get secret cloud-export namespace=payments'},
  ],
  patchTitle:'Исправь pipeline и workload manifest',
  patchTheory:'Закрепи digest, включи OIDC, убери secrets из image, сузь RBAC и runtime privileges, добавь NetworkPolicy.',
  vulnerablePatch:`image: registry.local/ledger-api:stable
serviceAccountName: ledger-runner
automountServiceAccountToken: true
securityContext:
  privileged: true
ci:
  cloud_key: STATIC_KEY_77
rbac: cluster-admin
network: allow-all`,
  securePatch: `image: registry.local/ledger-api@sha256:good44
permissions:
  id-token: write
serviceAccountName: ledger-runner
automountServiceAccountToken: false
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
rbac:
  namespace: payments
  verbs: [get]
  resources: [configmaps]
---
kind: NetworkPolicy
metadata:
  namespace: payments
spec:
  policyTypes: [Ingress, Egress]`,
  requiredPatterns:['@sha256:', 'id-token: write', 'runasnonroot: true', 'readonlyrootfilesystem: true', 'allowprivilegeescalation: false', 'automountserviceaccounttoken: false', 'kind: networkpolicy', 'namespace: payments'],
  forbiddenPatterns:[':stable', 'static_key', 'cluster-admin', 'privileged: true', 'allow-all'],
  independentCommands:[
    {id:'pods',title:'Найди неподписанный image',theory:'Сравни digest running pod с allow-list.',command:'kubectl get pods -n archive -o json',match:['get','pods','archive','json'],output:'archive-api image=registry.local/archive@sha256:771bad\nexpected=sha256:771good'},
    {id:'admission',title:'Проверь admission policy',theory:'Admission может блокировать unsigned/unpinned images до запуска.',command:'kubectl get validatingadmissionpolicies',match:['validatingadmission'],output:'require-signed-images=disabled\nrequire-digest=missing'},
    {id:'egress',title:'Проверь egress',theory:'Default deny снижает радиус утечки при компрометации pod.',command:'kubectl get networkpolicy -n archive',match:['networkpolicy','archive'],output:'No resources found\nobserved egress=203.0.113.91:443'},
  ],
  independentQuestions:[
    q('cause','Что позволило подмене работать?',[['a','Mutable tag, отсутствие signature admission и digest pinning',true],['b','Read-only filesystem'],['c','SBOM']]),
    q('contain','Что локализовать?',[['a','Остановить bad digest, отозвать SA/cloud sessions, сохранить audit',true],['b','Удалить весь Git history'],['c','Выключить DNS навсегда']]),
  ],
  reports:[
    q('chain','Цепочка',[['a','Pipeline → unsigned image → overprivileged SA → secret/cloud access',true],['b','DNS → monitor brightness'],['c','TLS certificate → SQL syntax']]),
    q('prevent','Предотвращение',[['a','OIDC, signed provenance, digest pinning, least RBAC, admission, NetworkPolicy',true],['b','Новый цвет тега'],['c','Один общий admin token']]),
    q('evidence','Доказательства',[['a','Git/audit logs, image digest, provenance, registry, cluster audit',true],['b','Скриншот рабочего стола'],['c','Только имя pod']]),
  ],
  sources:['Kubernetes Security Checklist','NIST SSDF','SLSA','CIS Kubernetes Benchmark'],
};

export const architectureModule: AdvancedModuleConfig = {
  prefix:'architectureCase', caseId:'BASTION-14', title:'Security Engineering', subtitle:'ZERO TRUST / VM / BACKUP / RISK',
  brief:'Greylock расширяет инфраструктуру в три города. Бюджета на всё нет. Нужно спроектировать доступы, сегментацию, telemetry, vulnerability management и восстановление.',
  contact:'Нужен рабочий проект, а не список дорогих продуктов. Покажи приоритеты, владельцев риска и проверяемые RTO/RPO.',
  environment:'ARCHITECTURE SIMULATION / LIMITED BUDGET',
  stageNames:['Вводная','Основа','Инвентаризация','Архитектура','Проверка проекта','Отчёт','Готово'],
  concepts:[
    {title:'ASSETS',text:'Нельзя защищать то, что не найдено и не имеет владельца.'},
    {title:'RISK',text:'Приоритет зависит от exploitability, exposure, business impact и доступных mitigations.'},
    {title:'ZERO TRUST',text:'Сеть сама по себе не является доверием: проверяются identity, device и resource policy.'},
    {title:'RESILIENCE',text:'Backup считается рабочим после восстановления и проверки целостности.'},
    {title:'RTO/RPO',text:'RTO — допустимое время восстановления. RPO — допустимая потеря данных по времени.'},
  ],
  architecture:[
    {role:'BUSINESS',title:'Settlement',detail:'RTO 45m / RPO 5m'},
    {role:'IDENTITY',title:'Central IdP',detail:'MFA + device posture'},
    {role:'NETWORK',title:'3 sites',detail:'Legacy flat access'},
    {role:'BACKUP',title:'Vault',detail:'Online only'},
    {role:'TELEMETRY',title:'SIEM',detail:'Cloud and DB gaps'},
  ],
  foundation:[
    q('zta','Что означает Zero Trust?',[['a','Нет неявного доверия только из-за сети или владения устройством',true],['b','Никому никогда нельзя дать доступ'],['c','Нужно удалить все VLAN']]),
    q('rpo','RPO 5 минут означает…',[['a','Допустима потеря не более примерно пяти минут данных',true],['b','Сервис обязан подняться за пять минут'],['c','Пароль меняется каждые пять минут']]),
    q('vuln','Как приоритизировать CVE?',[['a','Exposure, exploitability, asset criticality и compensating controls',true],['b','Только по максимальному CVSS'],['c','По длине названия']]),
    q('accept','Что нужно для принятия риска?',[['a','Владелец, срок, обоснование, compensating controls и пересмотр',true],['b','Устное согласие любого сотрудника'],['c','Удалить finding']]),
  ],
  commands:[
    {id:'assets',title:'Построй inventory',theory:'Свяжи asset, owner, data, criticality, exposure и telemetry.',command:'assetctl inventory --include cloud,endpoint,network,saas',match:['assetctl','inventory','cloud'],output:'assets=214\nowners_missing=31\npublic=9\ncritical_unmanaged=4\nsaas_without_sso=6'},
    {id:'risk',title:'Ранжируй уязвимости',theory:'CVSS без контекста не определяет бизнес-приоритет.',command:'riskctl prioritize --context business,exposure,kev',match:['riskctl','prioritize','business'],output:'P1 VPN-GW-02 exploited=true public=true critical=true\nP2 FILE-01 cvss=9.8 isolated=true compensating=EDR\nP3 LAB-07 cvss=10 public=false disposable=true'},
    {id:'telemetry',title:'Найди gaps',theory:'Архитектура detection начинается с источников и сохранности данных.',command:'telemetryctl coverage --critical-only',match:['telemetryctl','coverage','critical'],output:'settlement-api=ok\ncloud-data-events=missing\ndb-audit=missing\nidentity=ok\nbackup-admin=partial'},
    {id:'backup',title:'Проверь восстановление',theory:'Наличие backup не равно возможности восстановиться.',command:'backupctl restore-test settlement-db --point 04:10Z',match:['backupctl','restore-test','settlement-db'],output:'restore_time=71m TARGET_RTO=45m\ndata_gap=19m TARGET_RPO=5m\nimmutability=false\nintegrity=pass'},
    {id:'access',title:'Проверь trust boundaries',theory:'Policy должна учитывать identity, device, resource и session risk.',command:'ztctl evaluate access-matrix',match:['ztctl','evaluate','access-matrix'],output:'legacy-vpn -> settlement-admin ALLOW network_location_only\ncontractor -> prod-db ALLOW unmanaged_device\nservice identities without rotation=8'},
  ],
  patchTitle:'Собери целевую архитектуру',
  patchTheory:'Опиши identity-aware access, сегментацию, telemetry, vulnerability process, immutable backups, RTO/RPO и risk exceptions.',
  vulnerablePatch:`TRUST=inside-network
MFA=admins-only
SEGMENTS=flat
LOGS=endpoint-only
PATCH=monthly-all
BACKUP=online-single-copy
RTO=unknown
RPO=unknown
RISK_ACCEPTANCE=none`,
  securePatch: `ACCESS=identity-aware + device posture + least privilege
SEGMENT=workload and resource boundaries
LOGS=central logs + cloud data events + identity + backup admin
VULNERABILITY=exposure+business+KEV with risk owner
BACKUP=immutable backup + restore test
RTO=45
RPO=5
RISK=owner + exception expiry + compensating controls`,
  requiredPatterns:['identity-aware', 'device posture', 'least privilege', 'segment', 'central logs', 'cloud data events', 'immutable backup', 'restore test', 'rto=45', 'rpo=5', 'risk owner', 'exception expiry'],
  forbiddenPatterns:['trust=inside-network', 'segments=flat', 'rto=unknown', 'rpo=unknown', 'online-single-copy'],
  independentCommands:[
    {id:'tabletop',title:'Проведи tabletop',theory:'Проверь роли, зависимости и decision points до аварии.',command:'resiliencectl tabletop ransomware-settlement',match:['tabletop','ransomware-settlement'],output:'gap=no offline admin credentials\ngap=legal contact outdated\ngap=manual failover untested'},
    {id:'budget',title:'Проверь бюджет',theory:'Сначала снижай максимальный риск, затем улучшай покрытие.',command:'budgetctl optimize --limit 18000000',match:['budgetctl','18000000'],output:'fund: identity federation, immutable backup, cloud audit, 1 detection engineer\ndefer: SIEM replacement\nresidual_risk: legacy ERP isolation'},
    {id:'exception',title:'Проверь risk register',theory:'Исключение без владельца и срока становится постоянной дырой.',command:'riskctl exceptions --expired',match:['exceptions','expired'],output:'ERP-TLS1.0 owner=CFO expired=43d\nVendor-VPN owner=none expired=12d'},
  ],
  independentQuestions:[
    q('priority','Что финансировать первым?',[['a','Identity, immutable recovery и missing critical telemetry',true],['b','Полная замена SIEM только из-за бренда'],['c','Новые мониторы']]),
    q('residual','Что делать с legacy ERP?',[['a','Изолировать, ограничить identity, мониторить, назначить owner и срок замены',true],['b','Игнорировать'],['c','Выдать доступ всем']]),
  ],
  reports:[
    q('design','Главный принцип',[['a','Доступ к resource проверяется по identity/device/context, не по нахождению внутри сети',true],['b','Внутренняя сеть всегда доверенная'],['c','Только firewall решает всё']]),
    q('recovery','Критерий готовности backup',[['a','Проверенное восстановление в целевые RTO/RPO',true],['b','Файл backup существует'],['c','Backup называется immutable']]),
    q('risk','Управление остаточным риском',[['a','Owner, срок, controls, метрика и пересмотр',true],['b','Скрыть finding'],['c','Поменять severity вручную']]),
  ],
  sources:['NIST SP 800-207','CIS Controls 8.1','NIST CSF 2.0','CISA KEV'],
};

export const capstoneModule: AdvancedModuleConfig = {
  prefix:'capstoneCase', caseId:'BLACKSKY-15', title:'Independent Enterprise Incident', subtitle:'CAPSTONE / NO FIXED ROUTE',
  brief:'У Greylock одновременно пропали выплаты, изменился container image и появился внешний OAuth grant. Даны неполные журналы девяти систем. Игрок сам выбирает порядок проверки.',
  contact:'Готового маршрута нет. Сначала зафиксируй гипотезы. Любое жёсткое действие должно иметь причину и scope.',
  environment:'FULL SYNTHETIC ENTERPRISE / ACTIVE ADVERSARY',
  stageNames:['Брифинг','Модель','Расследование','План ответа','Финальная проверка','Отчёт','Готово'],
  concepts:[
    {title:'HYPOTHESIS',text:'Формулируй проверяемое объяснение и данные, которые могут его подтвердить или опровергнуть.'},
    {title:'SCOPE',text:'Разделяй confirmed, suspected и clean assets.'},
    {title:'EVIDENCE',text:'Сохраняй время, источник, целостность и ограничения каждого артефакта.'},
    {title:'BUSINESS',text:'Containment должен снижать ущерб и сохранять критичные операции, где это возможно.'},
    {title:'ROOT CAUSE',text:'Закрытие индикатора без исправления trust/pipeline причины оставляет повторный путь.'},
  ],
  architecture:[
    {role:'IDENTITY',title:'IdP + OAuth',detail:'Developer session'},
    {role:'SOURCE',title:'Git / CI',detail:'OIDC workflow'},
    {role:'CONTAINER',title:'Kubernetes',detail:'payments namespace'},
    {role:'CLOUD',title:'Object storage',detail:'settlement exports'},
    {role:'ENTERPRISE',title:'AD / Mail',detail:'staff identities'},
    {role:'DEFENSE',title:'SIEM / EDR',detail:'partial telemetry'},
  ],
  foundation:[
    q('first','Что делать первым?',[['a','Зафиксировать время, ограничения, критичные сервисы и доступные источники',true],['b','Выключить всю компанию'],['c','Удалить подозрительный image']]),
    q('absence','Нет события в SIEM. Это доказывает отсутствие активности?',[['a','Нет, сначала проверить coverage и retention',true],['b','Да всегда'],['c','Да, если событие старше часа']]),
    q('root','Что является root cause?',[['a','Системная причина, позволившая цепочке возникнуть и повториться',true],['b','Первый найденный IP'],['c','Название malware']]),
    q('report','Что должно быть в executive report?',[['a','Impact, scope, decisions, residual risk и next actions',true],['b','Полный дамп команд'],['c','Только IOC']]),
  ],
  commands:[
    {id:'mail',title:'Почтовая и OAuth цепочка',theory:'Проверь исходный доступ к identity.',command:'mailctl trace developer@greylock --since 00:00Z',match:['mailctl','developer@greylock'],output:'00:41 OAuth consent app=BuildHelper scopes=repo.write,offline_access\n00:44 refresh_token issued source=198.51.100.88'},
    {id:'git',title:'Изменения source и workflow',theory:'Свяжи identity с конкретным commit и workflow run.',command:'gitsec audit --repo payments --since 00:00Z',match:['gitsec','payments'],output:'00:49 workflow .github/deploy.yml modified by developer@greylock\nchange trust subject=repo:greylock/*\nreview bypassed'},
    {id:'ci',title:'CI/OIDC события',theory:'Проверь claims, issuer, subject и выданную role.',command:'cictl oidc sessions --workflow deploy.yml',match:['cictl','oidc','deploy.yml'],output:'00:53 subject=repo:greylock/fork:ref:refs/heads/main role=prod-builder\npolicy subject wildcard matched'},
    {id:'registry',title:'Artifact provenance',theory:'Сравни digest, signature и expected build.',command:'registryctl verify payments-api:stable',match:['registryctl','payments-api'],output:'tag=stable digest=sha256:bad900\nexpected=sha256:good811\nsignature=missing\nprovenance=unknown'},
    {id:'k8s',title:'Cluster audit',theory:'Проверь ServiceAccount, secrets и созданные workload.',command:'kubectl audit search -n payments --since 00:50Z',match:['kubectl','audit','payments'],output:'00:57 deploy image=sha256:bad900 by=prod-builder\n01:02 ledger-sa list secrets\n01:05 pod/diag created SA=ledger-sa'},
    {id:'cloud',title:'Cloud data access',theory:'Проверь временную role и data events.',command:'cloudctl trail lookup --role settlement-export --since 00:50Z',match:['cloudctl','settlement-export'],output:'01:08 AssumeRole source=pod/diag\n01:11 GetObject settlements/2026-07.csv\n01:14 PutObject external-drop/chunk-01'},
    {id:'edr',title:'Endpoint scope',theory:'Проверь, есть ли отдельный endpoint path.',command:'edrctl hunt --indicator BuildHelper --all-hosts',match:['edrctl','buildhelper'],output:'DEV-14 browser token cache accessed 00:43\nno process execution on other endpoints\ncoverage=96%'},
    {id:'dfir',title:'Собери timeline',theory:'Единая шкала времени отделяет причинную цепочку от совпадений.',command:'dfirctl timeline --case BLACKSKY-15',match:['dfirctl','blacksky-15'],output:'00:41 OAuth consent\n00:49 workflow change\n00:53 OIDC role\n00:57 bad image\n01:02 secret access\n01:08 cloud role\n01:11 data read\n01:14 external write'},
  ],
  guidedAnyOrder:true,
  patchTitle:'Напиши полный план Incident Response',
  patchTheory:'План должен разделять evidence, containment, eradication, recovery, detection и root-cause fixes. Не выключай clean systems без основания.',
  vulnerablePatch:`ROOT_CAUSE=unknown
SCOPE=all systems
CONTAINMENT=shutdown everything
EVIDENCE=delete bad image
ERADICATION=rotate one password
RECOVERY=restart
DETECTION=block one IP
RESIDUAL_RISK=none`,
  securePatch: `ROOT_CAUSE=OAuth refresh token + wildcard OIDC trust + unsigned image
SCOPE=developer DEV-14 + payments namespace + settlement-export role
EVIDENCE=preserve evidence before removing bad digest
CONTAINMENT=revoke refresh token + restrict OIDC subject + stop bad digest
ERADICATION=pin digest + require signature + rotate service account
RECOVERY=staged recovery with business validation
DETECTION=OAuth consent + OIDC wildcard + unsigned prod image + SA cloud chain
RESIDUAL_RISK=destination attribution incomplete due telemetry gaps`,
  requiredPatterns:['root_cause=oauth', 'oidc trust', 'unsigned image', 'scope=developer', 'payments namespace', 'settlement-export', 'preserve evidence', 'revoke refresh token', 'restrict oidc subject', 'pin digest', 'rotate service account', 'staged recovery', 'detection', 'residual_risk'],
  forbiddenPatterns:['shutdown everything', 'delete bad image', 'scope=all systems', 'residual_risk=none'],
  independentCommands:[
    {id:'coverage',title:'Проверь telemetry gaps',theory:'Укажи, что нельзя доказать.',command:'telemetryctl gaps --case BLACKSKY-15',match:['telemetryctl','blacksky-15'],output:'missing=cloud DNS resolver logs 00:00-01:30\nmissing=registry pull logs on node-07\nimpact=destination attribution incomplete'},
    {id:'business',title:'Проверь бизнес-зависимости',theory:'Containment должен учитывать расчёты и юридические сроки.',command:'bizctl critical-path settlement',match:['bizctl','settlement'],output:'settlement-api max_downtime=45m\nmanual_mode capacity=18%\nregulatory_notice threshold=confirmed data disclosure'},
    {id:'replay',title:'Проверь новые detection rules',theory:'Правило должно ловить цепочку и не создавать поток ложных алертов.',command:'detectctl replay BLACKSKY-15 --rules oidc-wildcard,unsigned-prod-image,sa-cloud-chain',match:['detectctl','replay','blacksky-15'],output:'oidc-wildcard TP=1 FP=0\nunsigned-prod-image TP=1 FP=2\nsa-cloud-chain TP=1 FP=0\nrequired tuning=image exception allow-list'},
  ],
  independentQuestions:[
    q('cause','Наиболее полная root cause',[['a','OAuth compromise + wildcard OIDC trust + unsigned mutable deploy + overprivileged workload identity',true],['b','Один внешний IP'],['c','Пользователь открыл браузер']]),
    q('scope','Подтверждённый scope',[['a','DEV-14 identity, payments workflow/image/namespace, settlement-export role and accessed objects',true],['b','Все компьютеры мира'],['c','Только почтовый ящик']]),
    q('unknown','Что осталось неизвестно?',[['a','Часть destination attribution из-за gaps DNS/registry telemetry',true],['b','Вообще ничего'],['c','Название компании']]),
  ],
  reports:[
    q('impact','Impact',[['a','Несанкционированный доступ к settlement export и нарушение pipeline trust',true],['b','Только неудачный login'],['c','Физическое уничтожение дата-центра']]),
    q('containment','Containment',[['a','Revoke OAuth/roles, stop bad digest, isolate affected identities/workloads, preserve logs',true],['b','Выключить все clean systems'],['c','Удалить SIEM']]),
    q('prevention','Root-cause fixes',[['a','Restrict OIDC claims, require review/signing/digest, least workload identity, complete telemetry',true],['b','Поменять IP blocklist'],['c','Переименовать repository']]),
  ],
  sources:['NIST SP 800-61r3','MITRE ATT&CK','NIST SSDF','NIST SP 800-207','CIS Controls 8.1'],
};
