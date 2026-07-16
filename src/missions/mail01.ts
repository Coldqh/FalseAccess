export const mailCaseOverview = [
  { label: 'Контур', value: 'CINDERLINE MAIL' },
  { label: 'Инцидент', value: 'подмена платёжного письма' },
  { label: 'Устройства', value: 'gateway / mailbox / WS-14 / proxy' },
  { label: 'Режим', value: 'изолированная копия' },
] as const;

export const mailArchitecture = [
  { id: 'sender', role: 'EXTERNAL', title: 'SMTP sender', subtitle: 'передаёт письмо шлюзу', address: 'mx.sender.example' },
  { id: 'gateway', role: 'EDGE', title: 'Mail Gateway', subtitle: 'SPF, DKIM, DMARC, attachment scan', address: 'mx.cinderline.local' },
  { id: 'mailbox', role: 'IDENTITY', title: 'Mailbox', subtitle: 'правила, OAuth и сессии', address: 'payables@cinderline.local' },
  { id: 'endpoint', role: 'HOST', title: 'WS-14', subtitle: 'Word, PowerShell, browser', address: '10.42.7.14' },
  { id: 'proxy', role: 'NETWORK', title: 'Proxy / DNS', subtitle: 'внешние обращения', address: 'proxy-01' },
] as const;

const option = (id: string, text: string, correct = false) => ({ id, text, correct });

export const mailFoundationQuestions = [
  {
    id: 'from-envelope',
    label: 'Что важнее для доставки и SPF?',
    options: [
      option('visible', 'Только видимое поле From'),
      option('envelope', 'Envelope-From / Return-Path и IP отправившего сервера', true),
      option('subject', 'Тема письма'),
    ],
  },
  {
    id: 'dkim',
    label: 'Что подтверждает DKIM?',
    options: [
      option('encrypt', 'Что письмо было зашифровано'),
      option('signature', 'Что подписанные части письма не менялись после подписи доменом', true),
      option('safe', 'Что вложение безопасно'),
    ],
  },
  {
    id: 'dmarc',
    label: 'Зачем нужен DMARC?',
    options: [
      option('alignment', 'Проверить согласование видимого From со SPF/DKIM и задать политику', true),
      option('antivirus', 'Запустить антивирус на рабочей станции'),
      option('backup', 'Создать резервную копию ящика'),
    ],
  },
  {
    id: 'received',
    label: 'Как читать цепочку Received?',
    options: [
      option('top', 'Сверху вниз как хронологию'),
      option('bottom', 'Снизу вверх: нижний доверенный hop ближе к началу пути', true),
      option('ignore', 'Received нельзя использовать в расследовании'),
    ],
  },
] as const;

export const mailHeaderObjectives = [
  {
    id: 'raw',
    title: 'Открой исходник письма',
    command: 'cat payment-update.eml',
    output: `From: "Cinderline Finance" <settlements@cinderline-pay.com>\nReturn-Path: <bounce@mailer-cdn.net>\nReply-To: ops-settle@protonmail.example\nSubject: Updated settlement details / 18:00\nMessage-ID: <20260716.1841@mailer-cdn.net>\nReceived: from mx.cinderline.local by mailstore.cinderline.local; Thu, 16 Jul 2026 18:42:12 +0300\nReceived: from relay-17.mailer-cdn.net (203.0.113.44) by mx.cinderline.local; Thu, 16 Jul 2026 18:42:10 +0300\nAuthentication-Results: mx.cinderline.local; spf=pass smtp.mailfrom=mailer-cdn.net; dkim=pass header.d=mailer-cdn.net; dmarc=fail header.from=cinderline-pay.com\nContent-Type: multipart/mixed; boundary="invoice"\nAttachment: Settlement_Change.docm`,
  },
  {
    id: 'received',
    title: 'Выдели транспортную цепочку',
    command: "grep -i '^Received:' payment-update.eml",
    output: `Received: from mx.cinderline.local by mailstore.cinderline.local; Thu, 16 Jul 2026 18:42:12 +0300\nReceived: from relay-17.mailer-cdn.net (203.0.113.44) by mx.cinderline.local; Thu, 16 Jul 2026 18:42:10 +0300`,
  },
  {
    id: 'auth',
    title: 'Проверь результаты аутентификации',
    command: "grep -i 'Authentication-Results\|Return-Path\|Reply-To' payment-update.eml",
    output: `Return-Path: <bounce@mailer-cdn.net>\nReply-To: ops-settle@protonmail.example\nAuthentication-Results: mx.cinderline.local; spf=pass smtp.mailfrom=mailer-cdn.net; dkim=pass header.d=mailer-cdn.net; dmarc=fail header.from=cinderline-pay.com`,
  },
  {
    id: 'dns',
    title: 'Сверь почтовые политики домена',
    command: 'dig TXT _dmarc.cinderline-pay.com +short',
    output: `"v=DMARC1; p=none; rua=mailto:dmarc@cinderline-pay.com; adkim=r; aspf=r"`,
  },
] as const;

export const mailHeaderQuestions = [
  {
    id: 'auth-result',
    label: 'Почему SPF и DKIM прошли, а DMARC провалился?',
    options: [
      option('aligned', 'SPF и DKIM относятся к mailer-cdn.net, а видимый From — cinderline-pay.com', true),
      option('attachment', 'Из-за расширения .docm'),
      option('time', 'Из-за разницы времени между серверами'),
    ],
  },
  {
    id: 'reply',
    label: 'Какой заголовок усиливает подозрение?',
    options: [
      option('replyto', 'Reply-To уводит ответы на другой домен', true),
      option('messageid', 'Message-ID содержит дату'),
      option('mime', 'Письмо multipart/mixed'),
    ],
  },
  {
    id: 'policy',
    label: 'Почему шлюз всё равно пропустил письмо?',
    options: [
      option('none', 'DMARC-политика домена стоит в p=none, а локальное правило не блокирует mismatch', true),
      option('spf', 'SPF всегда разрешает доставку'),
      option('dkim', 'DKIM отключает фильтрацию вложений'),
    ],
  },
] as const;

export const mailAttachmentObjectives = [
  {
    id: 'file',
    title: 'Определи тип вложения',
    command: 'file Settlement_Change.docm',
    output: `Settlement_Change.docm: Microsoft Word 2007+ macro-enabled document`,
  },
  {
    id: 'hash',
    title: 'Посчитай хэш до анализа',
    command: 'sha256sum Settlement_Change.docm',
    output: `6d3d92e18f27d6eac2df9b2c0a2f47613ac32f8e0e0f09e373bbfd9ad4ea1c77  Settlement_Change.docm`,
  },
  {
    id: 'strings',
    title: 'Извлеки безопасные строки из копии',
    command: "strings Settlement_Change.docm | grep -Ei 'powershell|http|template|document_open'",
    output: `Document_Open\nUpdate settlement template\npowershell.exe -NoProfile -WindowStyle Hidden -File %TEMP%\\preview.ps1\nhttps://cdn-sync.example/assets/preview.dat`,
  },
  {
    id: 'events',
    title: 'Свяжи вложение с рабочей станцией',
    command: "grep -E 'WINWORD|powershell|preview.dat|WS-14' endpoint-events.jsonl",
    output: `18:44:03 host=WS-14 event=process parent=OUTLOOK.EXE child=WINWORD.EXE file=Settlement_Change.docm\n18:44:21 host=WS-14 event=process parent=WINWORD.EXE child=powershell.exe command="-NoProfile -File C:\\Users\\mira\\AppData\\Local\\Temp\\preview.ps1"\n18:44:23 host=WS-14 event=file path=C:\\Users\\mira\\AppData\\Local\\Temp\\preview.dat sha256=ed615...\n18:44:25 host=WS-14 event=network process=powershell.exe dst=203.0.113.71:443 sni=cdn-sync.example`,
  },
  {
    id: 'proxy',
    title: 'Проверь сетевой масштаб',
    command: "grep -E 'cdn-sync.example|203.0.113.71' proxy.log",
    output: `18:44:25 src=10.42.7.14 user=mira dst=203.0.113.71:443 sni=cdn-sync.example action=allowed bytes_out=18422\n19:02:11 src=10.42.7.29 user=operator7 dst=203.0.113.71:443 sni=cdn-sync.example action=blocked bytes_out=0`,
  },
] as const;

export const mailAttachmentQuestions = [
  {
    id: 'chain',
    label: 'Какая цепочка подтверждена?',
    options: [
      option('office', 'OUTLOOK → WINWORD → PowerShell → внешний TLS-канал', true),
      option('browser', 'Browser → cmd → SMB'),
      option('mailbox', 'SMTP → database → SSH'),
    ],
  },
  {
    id: 'scope',
    label: 'Какие машины требуют проверки?',
    options: [
      option('both', 'WS-14 с разрешённым соединением и WS-29 с заблокированной попыткой', true),
      option('one', 'Только WS-14'),
      option('all', 'Сразу весь домен без проверки'),
    ],
  },
  {
    id: 'evidence',
    label: 'Что нельзя делать первым?',
    options: [
      option('delete', 'Удалять письмо и файл до фиксации исходника, хэша и журналов', true),
      option('isolate', 'Изолировать подтверждённо заражённый узел'),
      option('revoke', 'Отозвать активные сессии после фиксации'),
    ],
  },
] as const;

export const mailGatewayObjectives = [
  {
    id: 'rule',
    title: 'Открой текущую политику шлюза',
    command: 'cat gateway-policy.yml',
    output: `dmarc:\n  action_on_fail: tag\n  reject_when_policy: reject\nattachments:\n  macro_documents: allow_with_banner\nreply_to_mismatch:\n  action: log\nurl_rewrite: true`,
  },
  {
    id: 'mailbox',
    title: 'Проверь правила и OAuth ящика',
    command: 'cat mailbox-audit.jsonl',
    output: `18:47:02 user=mira action=CreateInboxRule name="Archive settlements" forwardTo=ops-settle@protonmail.example\n18:48:11 user=mira action=ConsentToApp app="Quick PDF Cloud" scopes="Mail.Read offline_access" ip=203.0.113.71\n18:51:14 user=mira action=MailItemsAccessed count=84 client=GraphAPI ip=203.0.113.71`,
  },
] as const;

export const mailVulnerablePolicy = `dmarc:
  action_on_fail: tag
  reject_when_policy: reject
attachments:
  macro_documents: allow_with_banner
reply_to_mismatch:
  action: log
mailbox:
  external_forwarding: allow
  user_oauth_consent: allow
`;

export const mailSecurePolicy = `dmarc:
  action_on_fail: quarantine
  reject_when_policy: reject
attachments:
  macro_documents: sandbox
  block_on_malicious_chain: true
reply_to_mismatch:
  action: quarantine
mailbox:
  external_forwarding: block
  user_oauth_consent: admin_approval
response:
  revoke_refresh_tokens: true
  remove_malicious_rules: true
`;

export const mailPolicyQuestions = [
  {
    id: 'dmarc-policy',
    label: 'Как обращаться с DMARC fail при чужом подписывающем домене?',
    options: [
      option('quarantine', 'Карантин и разбор, а при p=reject — отклонение', true),
      option('deliver', 'Всегда доставлять, если SPF pass'),
      option('delete-all', 'Удалять всю внешнюю почту'),
    ],
  },
  {
    id: 'oauth',
    label: 'Что делать с приложением Quick PDF Cloud?',
    options: [
      option('revoke', 'Отозвать consent и refresh tokens, проверить действия GraphAPI', true),
      option('password', 'Только сменить пароль'),
      option('ignore', 'OAuth не связан с почтой'),
    ],
  },
  {
    id: 'forward',
    label: 'Что делать с правилом пересылки?',
    options: [
      option('preserve-remove', 'Зафиксировать параметры, затем удалить и проверить похожие правила', true),
      option('delete-first', 'Сразу удалить без сохранения'),
      option('keep', 'Оставить для наблюдения без ограничений'),
    ],
  },
] as const;

export const mailContainmentSections = [
  {
    id: 'evidence',
    label: 'Первый шаг',
    options: [
      option('preserve', 'Сохранить raw EML, вложение, хэши, gateway/mailbox/endpoint/proxy logs', true),
      option('wipe', 'Очистить ящик и временные файлы'),
      option('reply', 'Ответить отправителю'),
    ],
  },
  {
    id: 'endpoint',
    label: 'Рабочая станция',
    options: [
      option('isolate', 'Изолировать WS-14, собрать volatile-данные и проверить WS-29', true),
      option('shutdown', 'Выключить весь офис'),
      option('continue', 'Оставить без ограничений'),
    ],
  },
  {
    id: 'identity',
    label: 'Учётная запись',
    options: [
      option('revoke', 'Отозвать токены и сессии, убрать правило, проверить MFA и OAuth consent', true),
      option('password-only', 'Только сменить пароль'),
      option('mail-only', 'Удалить одно письмо'),
    ],
  },
  {
    id: 'gateway',
    label: 'Почтовый шлюз',
    options: [
      option('hunt', 'Карантин по индикаторам и поиск похожих сообщений у других получателей', true),
      option('block-domain-only', 'Заблокировать только видимый From'),
      option('disable', 'Отключить всю почту навсегда'),
    ],
  },
] as const;

export const mailIndependentCommands = [
  {
    id: 'raw',
    command: 'cat partner-reset.eml',
    output: `From: Access Desk <access@partner-support.example>\nReturn-Path: <noreply@partner-support.example>\nAuthentication-Results: spf=pass; dkim=pass header.d=partner-support.example; dmarc=pass\nSubject: Re-authorize shared mailbox\nBody URL: https://partner-auth.example/connect`,
  },
  {
    id: 'redirect',
    command: 'cat url-rewrite.log',
    output: `20:11:05 original=https://partner-auth.example/connect final=https://login-cinderline.example/oauth/authorize?client_id=mail-sync-77`,
  },
  {
    id: 'oauth',
    command: "grep 'mail-sync-77' oauth-audit.jsonl",
    output: `20:12:44 user=dispatch2 app=mail-sync-77 scopes="Mail.ReadWrite offline_access" publisher=unverified ip=198.51.100.92\n20:13:11 user=dispatch2 event=RefreshTokenIssued app=mail-sync-77`,
  },
  {
    id: 'activity',
    command: "grep 'dispatch2' mailbox-activity.jsonl",
    output: `20:14:03 user=dispatch2 event=CreateInboxRule name="RSS" moveTo=RSS Feeds\n20:14:44 user=dispatch2 event=MailItemsAccessed count=213 app=mail-sync-77 ip=198.51.100.92`,
  },
  {
    id: 'hunt',
    command: "grep -R 'mail-sync-77\|198.51.100.92' tenant-audit/",
    output: `dispatch2: consent + token + mailbox access\nwarehouse1: consent denied\nfinance3: URL opened, no consent`,
  },
] as const;

export const mailIndependentQuestions = [
  {
    id: 'vector',
    label: 'Что произошло во втором инциденте?',
    options: [
      option('oauth', 'Письмо привело к OAuth consent; приложение получило offline_access и доступ к почте', true),
      option('macro', 'На устройстве запустился макрос'),
      option('smtp', 'Взломан MX-сервер'),
    ],
  },
  {
    id: 'auth',
    label: 'Почему SPF/DKIM/DMARC не спасли?',
    options: [
      option('legit-domain', 'Письмо действительно отправлено доменом, который контролирует злоумышленник; аутентификация не доказывает добросовестность', true),
      option('broken', 'Все три проверки не работали'),
      option('attachment', 'Из-за вложения'),
    ],
  },
  {
    id: 'scope',
    label: 'Какой подтверждённый масштаб?',
    options: [
      option('dispatch', 'Компрометирован dispatch2; у warehouse1 consent отклонён, finance3 только открыл URL', true),
      option('all', 'Все три ящика захвачены'),
      option('none', 'Компрометации нет'),
    ],
  },
] as const;

export const mailFindingSections = [
  {
    id: 'initial',
    label: 'Первичный доступ',
    options: [
      option('docm', 'Macro-enabled документ из письма; DMARC fail был доставлен из-за слабой политики', true),
      option('rdp', 'Внешний RDP'),
      option('usb', 'USB-носитель'),
    ],
  },
  {
    id: 'execution',
    label: 'Выполнение',
    options: [
      option('chain', 'OUTLOOK → WINWORD → PowerShell → preview.dat', true),
      option('kernel', 'Эксплойт ядра'),
      option('sql', 'SQL-инъекция'),
    ],
  },
  {
    id: 'identity',
    label: 'Закрепление в почте',
    options: [
      option('oauth-rule', 'Внешнее правило пересылки и OAuth-приложение с offline_access', true),
      option('password', 'Только смена пароля'),
      option('none', 'Признаков закрепления нет'),
    ],
  },
] as const;

export const mailReportSections = [
  {
    id: 'confirmed',
    label: 'Что подтверждено',
    options: [
      option('facts', 'Подмена From, DMARC fail, запуск PowerShell, внешний TLS-канал, правило пересылки и OAuth-доступ', true),
      option('guess', 'Полный захват всей сети'),
      option('sender', 'Личность владельца внешнего сервера'),
    ],
  },
  {
    id: 'not-confirmed',
    label: 'Что не подтверждено',
    options: [
      option('unknown', 'Кража платёжных средств и компрометация остальных ящиков без дополнительных журналов', true),
      option('mail', 'Факт получения письма'),
      option('ws', 'Запуск процесса на WS-14'),
    ],
  },
  {
    id: 'actions',
    label: 'Рекомендации',
    options: [
      option('full', 'Изоляция, отзыв токенов, удаление правил после фиксации, tenant hunt, усиление DMARC/gateway и блокировка индикаторов', true),
      option('delete', 'Удалить письмо и закрыть тикет'),
      option('shutdown', 'Отключить всю инфраструктуру'),
    ],
  },
] as const;
