export const adCaseOverview = [
  { label: 'ДОМЕН', value: 'IRONROOT.LOCAL' },
  { label: 'КОНТУР', value: 'LOGISTICS / FINANCE' },
  { label: 'СИГНАЛ', value: 'STALE CONTRACTOR ACCOUNT' },
  { label: 'МАСШТАБ', value: '5 HOSTS / 2 SEGMENTS' },
] as const;

export const adArchitecture = [
  { id: 'dc', role: 'DOMAIN CONTROLLER', title: 'DC-01', subtitle: 'AD DS, DNS, Kerberos, GPO', address: '10.44.0.10' },
  { id: 'jump', role: 'ADMIN ENTRY', title: 'JUMP-01', subtitle: 'привилегированный доступ', address: '10.44.0.20' },
  { id: 'file', role: 'FILE SERVER', title: 'FILE-02', subtitle: 'операционные документы', address: '10.44.1.12' },
  { id: 'app', role: 'APPLICATION', title: 'APP-03', subtitle: 'отчёты и сервисная учётка', address: '10.44.2.18' },
  { id: 'ws', role: 'WORKSTATION', title: 'WS-27', subtitle: 'точка входа подрядчика', address: '10.44.3.27' },
] as const;

export const adFoundationQuestions = [
  {
    id: 'directory', label: 'Что хранит Active Directory?', options: [
      { id: 'a', text: 'Учётные записи, компьютеры, группы, политики и связи между ними.', correct: true },
      { id: 'b', text: 'Только пароли пользователей.' },
      { id: 'c', text: 'Только журналы безопасности.' },
    ],
  },
  {
    id: 'groups', label: 'Почему членство в группе важно?', options: [
      { id: 'a', text: 'Через группы часто выдаются права к системам и административным действиям.', correct: true },
      { id: 'b', text: 'Группа меняет IP-адрес компьютера.' },
      { id: 'c', text: 'Группа автоматически шифрует диск.' },
    ],
  },
  {
    id: 'kerberos', label: 'Что делает Kerberos?', options: [
      { id: 'a', text: 'Выдаёт билеты для подтверждения личности и доступа к сервисам.', correct: true },
      { id: 'b', text: 'Хранит резервные копии файлов.' },
      { id: 'c', text: 'Фильтрует сетевые пакеты.' },
    ],
  },
  {
    id: 'gpo', label: 'Зачем нужна GPO?', options: [
      { id: 'a', text: 'Централизованно применять настройки, ограничения и скрипты к пользователям и компьютерам.', correct: true },
      { id: 'b', text: 'Создавать SQL-запросы.' },
      { id: 'c', text: 'Выдавать внешние IP-адреса.' },
    ],
  },
] as const;

export const adIdentityObjectives = [
  {
    id: 'domain', title: 'Параметры домена', command: 'Get-ADDomain', output:
`Forest                  : IRONROOT.LOCAL
DomainMode              : Windows2016Domain
PDCEmulator             : DC-01.ironroot.local
DistinguishedName       : DC=ironroot,DC=local`,
  },
  {
    id: 'users', title: 'Активные и старые учётные записи', command: 'Get-ADUser -Filter * -Properties Enabled,LastLogonDate | Select SamAccountName,Enabled,LastLogonDate', output:
`SamAccountName   Enabled LastLogonDate
----------------  ------- -------------------
admin.korovin     True    2026-05-04 09:11:02
svc_reports       True    2026-05-04 03:27:18
ctr_kalinin       True    2025-11-19 17:42:55
operator.17       True    2026-05-04 08:58:11`,
  },
  {
    id: 'admins', title: 'Проверить Domain Admins', command: 'Get-ADGroupMember "Domain Admins"', output:
`name             objectClass
----             -----------
admin.korovin    user
adm_breakglass   user`,
  },
  {
    id: 'fileops', title: 'Проверить доступ к файловому серверу', command: 'Get-ADGroupMember "File Operators"', output:
`name             objectClass
----             -----------
operator.17      user
svc_reports      user
ctr_kalinin      user`,
  },
  {
    id: 'service', title: 'Проверить сервисную учётную запись', command: 'Get-ADUser svc_reports -Properties ServicePrincipalName,TrustedForDelegation,MemberOf', output:
`SamAccountName        : svc_reports
ServicePrincipalName   : HTTP/APP-03.ironroot.local
TrustedForDelegation   : True
MemberOf               : CN=File Operators,OU=Groups,DC=ironroot,DC=local`,
  },
] as const;

export const adIdentityQuestions = [
  {
    id: 'stale', label: 'Какая учётная запись требует проверки первой?', options: [
      { id: 'a', text: 'ctr_kalinin: активна, давно не использовалась и всё ещё состоит в File Operators.', correct: true },
      { id: 'b', text: 'operator.17: входил сегодня и работает в смене.' },
      { id: 'c', text: 'DC-01: это компьютер, а не пользователь.' },
    ],
  },
  {
    id: 'service-risk', label: 'Что опасно в svc_reports?', options: [
      { id: 'a', text: 'Сервисная учётка имеет лишнюю группу и разрешённую делегацию.', correct: true },
      { id: 'b', text: 'У неё есть SPN — любой SPN означает компрометацию.' },
      { id: 'c', text: 'Имя начинается с svc.' },
    ],
  },
] as const;

export const adKerberosObjectives = [
  {
    id: 'tickets', title: 'Билеты на JUMP-01', command: 'klist', output:
`Current LogonId is 0:0x5a21d
Cached Tickets: (3)
#0> Client: ctr_kalinin @ IRONROOT.LOCAL
    Server: krbtgt/IRONROOT.LOCAL @ IRONROOT.LOCAL
#1> Client: ctr_kalinin @ IRONROOT.LOCAL
    Server: cifs/FILE-02.ironroot.local @ IRONROOT.LOCAL
#2> Client: ctr_kalinin @ IRONROOT.LOCAL
    Server: HTTP/APP-03.ironroot.local @ IRONROOT.LOCAL`,
  },
  {
    id: 'events', title: 'События входа и выдачи билетов', command: 'Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4624,4672,4768,4769} | Select TimeCreated,Id,Message', output:
`03:21:08 4768 TGT requested Account=ctr_kalinin ClientAddress=10.44.3.27 Result=0x0
03:21:14 4624 Logon Account=ctr_kalinin Workstation=WS-27 Target=JUMP-01 Type=10
03:22:03 4769 Service ticket Account=ctr_kalinin Service=cifs/FILE-02 ClientAddress=10.44.0.20
03:26:51 4769 Service ticket Account=ctr_kalinin Service=HTTP/APP-03 ClientAddress=10.44.0.20
03:27:04 4672 Special privileges Account=svc_reports Host=APP-03`,
  },
  {
    id: 'sessions', title: 'Активные SMB-сессии', command: 'Get-SmbSession | Select ClientComputerName,ClientUserName,NumOpens', output:
`ClientComputerName ClientUserName              NumOpens
------------------ --------------------------- --------
10.44.0.20         IRONROOT\\ctr_kalinin              7
10.44.3.41         IRONROOT\\operator.17               2`,
  },
  {
    id: 'logonscript', title: 'Применённая политика', command: 'gpresult /r /scope computer', output:
`COMPUTER SETTINGS
Applied Group Policy Objects
-----------------------------
Workstation Baseline
Drive Maps
Legacy Sync Agent

The following GPOs were not applied because they were filtered out: none`,
  },
] as const;

export const adKerberosQuestions = [
  {
    id: 'path', label: 'Какая последовательность подтверждена?', options: [
      { id: 'a', text: 'WS-27 → удалённый вход на JUMP-01 → билет CIFS к FILE-02 → билет HTTP к APP-03.', correct: true },
      { id: 'b', text: 'APP-03 первым подключился к WS-27.' },
      { id: 'c', text: 'Входов в домен не было.' },
    ],
  },
  {
    id: 'ticket-meaning', label: 'Что доказывает билет 4769?', options: [
      { id: 'a', text: 'Учётная запись запросила доступ к конкретному сервису; сам по себе билет не доказывает кражу данных.', correct: true },
      { id: 'b', text: 'Файл точно был скопирован.' },
      { id: 'c', text: 'Пароль пользователя раскрыт в журнале.' },
    ],
  },
] as const;

export const adGpoObjectives = [
  {
    id: 'gpo', title: 'Отчёт подозрительной GPO', command: 'Get-GPOReport -Name "Legacy Sync Agent" -ReportType Xml -Path C:\\IR\\legacy-sync.xml', output:
`GPO: Legacy Sync Agent
LinkedTo: OU=Workstations,DC=ironroot,DC=local
Computer Startup Script: \\IRONROOT.LOCAL\\SYSVOL\\IRONROOT.LOCAL\\scripts\\legacy-sync.ps1
Created: 2023-02-11
Modified: 2026-05-04 03:19:44
Editor: IRONROOT\\ctr_kalinin`,
  },
  {
    id: 'script', title: 'Содержимое startup-скрипта', command: 'Get-Content "\\\\IRONROOT.LOCAL\\SYSVOL\\IRONROOT.LOCAL\\scripts\\legacy-sync.ps1"', output:
`$share = "\\\\FILE-02\\ops"
New-PSDrive -Name X -PSProvider FileSystem -Root $share -Persist
Start-Process "\\\\FILE-02\\ops\\sync-agent.exe" -ArgumentList "--quiet"`,
  },
  {
    id: 'acl', title: 'Права на скрипт', command: 'Get-Acl "\\\\IRONROOT.LOCAL\\SYSVOL\\IRONROOT.LOCAL\\scripts\\legacy-sync.ps1" | Format-List', output:
`Owner  : BUILTIN\\Administrators
Access : IRONROOT\\Domain Admins Allow FullControl
         IRONROOT\\File Operators Allow Modify
         IRONROOT\\Authenticated Users Allow ReadAndExecute`,
  },
] as const;

export const adVulnerablePatch = `# legacy-sync.ps1
$share = "\\\\FILE-02\\ops"
New-PSDrive -Name X -PSProvider FileSystem -Root $share -Persist
Start-Process "\\\\FILE-02\\ops\\sync-agent.exe" -ArgumentList "--quiet"

# response.ps1
# TODO: остановить распространение, убрать лишние права и закрыть старую учётку
`;

export const adSecurePatch = `# legacy-sync-clean.ps1
$share = "\\\\FILE-02\\ops"
if (Test-Path $share) {
  New-PSDrive -Name X -PSProvider FileSystem -Root $share -Persist -ErrorAction SilentlyContinue
}

# response.ps1
Disable-ADAccount -Identity ctr_kalinin
Remove-ADGroupMember -Identity "File Operators" -Members ctr_kalinin -Confirm:$false
Set-ADUser -Identity svc_reports -TrustedForDelegation $false -AccountNotDelegated $true
Remove-ADGroupMember -Identity "File Operators" -Members svc_reports -Confirm:$false
`;

export const adCodeQuestions = [
  {
    id: 'script', label: 'Что обязательно убрать из startup-скрипта?', options: [
      { id: 'a', text: 'Запуск исполняемого файла из общей папки при старте компьютера.', correct: true },
      { id: 'b', text: 'Проверку существования сетевой папки.' },
      { id: 'c', text: 'Имя переменной $share.' },
    ],
  },
  {
    id: 'acl', label: 'Почему File Operators не должны менять SYSVOL-скрипт?', options: [
      { id: 'a', text: 'Изменение связанного GPO-скрипта влияет сразу на множество компьютеров.', correct: true },
      { id: 'b', text: 'SYSVOL нельзя читать обычным компьютерам.' },
      { id: 'c', text: 'Любая группа в AD автоматически является администратором домена.' },
    ],
  },
  {
    id: 'service', label: 'Что исправляется у svc_reports?', options: [
      { id: 'a', text: 'Убираются лишние права и небезопасная делегация, после чего секрет учётки ротируется.', correct: true },
      { id: 'b', text: 'Удаляется SPN без проверки зависимости приложения.' },
      { id: 'c', text: 'Учётная запись добавляется в Domain Admins.' },
    ],
  },
] as const;

export const adContainmentSections = [
  { id: 'preserve', label: 'До изменений', options: [
    { id: 'a', text: 'Сохранить Security logs, билеты, GPO report, SYSVOL-скрипт и ACL.', correct: true },
    { id: 'b', text: 'Очистить журналы, чтобы снизить нагрузку.' },
    { id: 'c', text: 'Перезагрузить все контроллеры домена.' },
  ] },
  { id: 'account', label: 'Учётная запись подрядчика', options: [
    { id: 'a', text: 'Отключить ctr_kalinin, завершить сессии и отозвать активные билеты.', correct: true },
    { id: 'b', text: 'Только переименовать пользователя.' },
    { id: 'c', text: 'Оставить активной для наблюдения без согласования.' },
  ] },
  { id: 'policy', label: 'Политика и SYSVOL', options: [
    { id: 'a', text: 'Отключить вредный запуск, восстановить проверенный скрипт и сузить ACL.', correct: true },
    { id: 'b', text: 'Удалить весь SYSVOL.' },
    { id: 'c', text: 'Оставить GPO, но скрыть её в консоли.' },
  ] },
  { id: 'service', label: 'Сервисная учётка', options: [
    { id: 'a', text: 'Убрать лишнее членство и делегацию, ротировать секрет с учётом зависимости APP-03.', correct: true },
    { id: 'b', text: 'Немедленно удалить svc_reports и не проверять приложение.' },
    { id: 'c', text: 'Добавить svc_reports в Domain Admins.' },
  ] },
  { id: 'hunt', label: 'Проверка масштаба', options: [
    { id: 'a', text: 'Искать ctr_kalinin, svc_reports, GPO GUID, sync-agent.exe и сервисные билеты по всем узлам.', correct: true },
    { id: 'b', text: 'Проверить только WS-27.' },
    { id: 'c', text: 'Проверить только список сотрудников.' },
  ] },
] as const;

export const adIndependentCommands = [
  { id: 'trust', command: 'Get-ADTrust -Filter *', output: 'Source=IRONROOT.LOCAL Target=BRANCH.IRONROOT.LOCAL Direction=Bidirectional IntraForest=True' },
  { id: 'computers', command: 'Get-ADComputer -SearchBase "OU=Branch,DC=ironroot,DC=local" -Filter * -Properties OperatingSystem', output: 'BR-DC-01 Windows Server 2028\nBR-FILE-01 Windows Server 2028\nBR-WS-09 Windows 12 Enterprise' },
  { id: 'operators', command: 'Get-ADGroupMember "Branch Backup Operators"', output: 'svc_backup\nhelpdesk.temp' },
  { id: 'events', command: 'Get-WinEvent -Path second-domain/branch-security.evtx | Where-Object Id -in 4624,4769,5140', output: '04:11:08 4624 account=helpdesk.temp source=10.55.9.9 target=BR-WS-09\n04:13:17 4769 account=helpdesk.temp service=cifs/BR-FILE-01\n04:13:22 5140 account=helpdesk.temp share=\\\\BR-FILE-01\\backup' },
  { id: 'acl', command: 'Get-Acl "AD:\\CN=svc_backup,OU=Service Accounts,DC=ironroot,DC=local" | Format-List', output: 'IRONROOT\\helpdesk.temp Allow GenericAll\nIRONROOT\\Domain Admins Allow FullControl' },
] as const;

export const adIndependentQuestions = [
  {
    id: 'scope', label: 'Что подтверждено во втором сегменте?', options: [
      { id: 'a', text: 'helpdesk.temp получил доступ к BR-FILE-01 и имеет GenericAll над svc_backup.', correct: true },
      { id: 'b', text: 'Контроллер BR-DC-01 точно захвачен.' },
      { id: 'c', text: 'Доверительных отношений между доменами нет.' },
    ],
  },
  {
    id: 'risk', label: 'Почему GenericAll опасен?', options: [
      { id: 'a', text: 'Делегированная учётка может менять объект svc_backup и получить больший доступ.', correct: true },
      { id: 'b', text: 'Это право только на чтение имени объекта.' },
      { id: 'c', text: 'GenericAll относится только к локальным файлам.' },
    ],
  },
  {
    id: 'limit', label: 'Чего пока нельзя утверждать?', options: [
      { id: 'a', text: 'Что данные из backup были вынесены наружу и что BR-DC-01 скомпрометирован.', correct: true },
      { id: 'b', text: 'Что был доступ к общей папке.' },
      { id: 'c', text: 'Что helpdesk.temp существует.' },
    ],
  },
] as const;

export const adFindingSections = [
  { id: 'initial', label: 'Начальная точка', options: [
    { id: 'a', text: 'Старая учётка ctr_kalinin оставалась активной и имела доступ через File Operators.', correct: true },
    { id: 'b', text: 'Пароль Domain Admin был раскрыт в журнале.' },
    { id: 'c', text: 'Начальная точка — DNS-сервер.' },
  ] },
  { id: 'movement', label: 'Перемещение', options: [
    { id: 'a', text: 'WS-27 → JUMP-01 → FILE-02 и APP-03 подтверждено Kerberos и логами входа.', correct: true },
    { id: 'b', text: 'Атакующий обязательно получил контроль над DC-01.' },
    { id: 'c', text: 'Перемещения между узлами не было.' },
  ] },
  { id: 'persistence', label: 'Закрепление', options: [
    { id: 'a', text: 'Изменённая GPO запускала sync-agent.exe из общей папки; ACL позволял File Operators менять скрипт.', correct: true },
    { id: 'b', text: 'Закрепление происходило через DHCP.' },
    { id: 'c', text: 'GPO не применялась к компьютерам.' },
  ] },
  { id: 'branch', label: 'Второй сегмент', options: [
    { id: 'a', text: 'helpdesk.temp получил доступ к branch-share и имеет опасное право над svc_backup.', correct: true },
    { id: 'b', text: 'Второй сегмент полностью чист.' },
    { id: 'c', text: 'Подтверждено уничтожение всех резервных копий.' },
  ] },
] as const;

export const adReportSections = [
  { id: 'scope', label: 'Масштаб', options: [
    { id: 'a', text: 'Подтверждены WS-27, JUMP-01, FILE-02, APP-03 и отдельный доступ к BR-FILE-01; компрометация DC не доказана.', correct: true },
    { id: 'b', text: 'Полностью захвачены оба домена.' },
    { id: 'c', text: 'Затронут только один пользователь.' },
  ] },
  { id: 'evidence', label: 'Сохранить', options: [
    { id: 'a', text: 'Security logs, Kerberos tickets, GPO reports, SYSVOL script/hash/ACL, SMB sessions и события второго сегмента.', correct: true },
    { id: 'b', text: 'Только список пользователей.' },
    { id: 'c', text: 'Удалить изменённый скрипт до снятия копии.' },
  ] },
  { id: 'response', label: 'Исправление', options: [
    { id: 'a', text: 'Отключить старые учётки, завершить сессии, очистить GPO, сузить ACL, убрать делегацию, ротировать сервисные секреты и проверить оба сегмента.', correct: true },
    { id: 'b', text: 'Выключить весь домен на неопределённый срок.' },
    { id: 'c', text: 'Сменить имя домена и не менять права.' },
  ] },
] as const;
