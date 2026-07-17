export const incidentCaseOverview = [
  { label: 'Контур', value: 'GREYLOCK / CASE 09' },
  { label: 'Системы', value: 'SIEM / EDR / IdP / Linux / Windows' },
  { label: 'Состояние', value: 'активный инцидент' },
  { label: 'Ограничение', value: 'расчётный сервис нельзя глушить целиком' },
] as const;

export const incidentArchitecture = [
  { id: 'edge', role: 'EDGE', title: 'GW-PAY-02', subtitle: 'Windows gateway / EDR', address: '10.61.4.22' },
  { id: 'admin', role: 'ADMIN', title: 'OPS-JUMP-01', subtitle: 'privileged jump host', address: '10.61.2.10' },
  { id: 'archive', role: 'LINUX', title: 'ARCHIVE-03', subtitle: 'backup and exports', address: '10.61.8.31' },
  { id: 'identity', role: 'IDENTITY', title: 'IDP-01', subtitle: 'accounts, tokens, MFA', address: 'idp.greylock.local' },
  { id: 'siem', role: 'DETECTION', title: 'WATCH-01', subtitle: 'SIEM + EDR telemetry', address: 'watch.greylock.local' },
] as const;

const option = (id: string, text: string, correct = false) => ({ id, text, correct });

export const incidentFoundationQuestions = [
  {
    id: 'phase', label: 'Чем containment отличается от eradication?', options: [
      option('difference', 'Containment ограничивает ущерб, eradication удаляет причину и закрепление', true),
      option('same', 'Это одно и то же действие'),
      option('report', 'Containment — только написание отчёта'),
    ],
  },
  {
    id: 'priority', label: 'Что важнее в первые минуты?', options: [
      option('facts', 'Подтвердить инцидент, сохранить volatile-данные и определить критичные активы', true),
      option('wipe', 'Сразу переустановить все машины'),
      option('announce', 'Сразу объявить полный масштаб без проверки'),
    ],
  },
  {
    id: 'business', label: 'Почему нельзя бездумно выключить весь расчётный контур?', options: [
      option('continuity', 'Можно остановить бизнес, потерять данные и усложнить расследование', true),
      option('never', 'Критические системы нельзя изолировать ни при каких условиях'),
      option('money', 'Только из-за стоимости электричества'),
    ],
  },
  {
    id: 'evidence', label: 'Что нужно фиксировать по каждому действию?', options: [
      option('record', 'Время, исполнитель, команда, причина, результат и затронутый актив', true),
      option('memory', 'Достаточно запомнить'),
      option('screens', 'Достаточно одного скриншота'),
    ],
  },
] as const;

export const triageObjectives = [
  {
    id: 'alert', title: 'Открой исходный SIEM-алерт',
    command: 'siem search alert_id=GL-8841',
    output: '02:07:14 severity=high host=GW-PAY-02 rule="service account + encoded PowerShell" user=svc_archive src=198.51.100.44\n02:07:18 edr_alert=EDR-4412 process=powershell.exe pid=4460 parent=w3wp.exe',
  },
  {
    id: 'tree', title: 'Проверь дерево процессов на gateway',
    command: 'edr process-tree --host GW-PAY-02 --pid 4460',
    output: 'w3wp.exe(3112)\n  powershell.exe(4460) -EncodedCommand ...\n    rundll32.exe(4516) C:\\ProgramData\\cache.dat,Start\n      relay.exe(4588) --token gl_rt_27a1',
  },
  {
    id: 'identity', title: 'Проверь использование сервисной учётки',
    command: 'siem search user=svc_archive earliest="01:30" latest="02:30"',
    output: '01:58:42 auth_success user=svc_archive src=198.51.100.44 target=VPN-GW method=password+mfa_bypass\n02:01:08 logon user=svc_archive host=OPS-JUMP-01 type=remote\n02:06:51 service_logon user=svc_archive host=GW-PAY-02',
  },
  {
    id: 'network', title: 'Найди внешний канал',
    command: 'siem search host=GW-PAY-02 dst_ip=198.51.100.44',
    output: '02:07:21 GW-PAY-02:51344 -> 198.51.100.44:443 process=relay.exe bytes_out=184320\n02:08:03 GW-PAY-02:51361 -> 198.51.100.44:443 process=relay.exe bytes_out=92160',
  },
  {
    id: 'scope', title: 'Проверь тот же индикатор по всем узлам',
    command: 'siem search "198.51.100.44 OR gl_rt_27a1 OR cache.dat" group_by=host',
    output: 'GW-PAY-02 hits=18\nOPS-JUMP-01 hits=7\nARCHIVE-03 hits=3\nDB-CORE-01 hits=0\nWEB-PAY-01 hits=0',
  },
] as const;

export const scopeQuestions = [
  {
    id: 'confirmed', label: 'Какие узлы подтверждённо затронуты?', options: [
      option('three', 'GW-PAY-02, OPS-JUMP-01 и ARCHIVE-03', true),
      option('all', 'Весь контур'),
      option('gateway', 'Только GW-PAY-02'),
    ],
  },
  {
    id: 'identity', label: 'Какая учётка требует немедленного контроля?', options: [
      option('svc', 'svc_archive', true),
      option('all-users', 'Все пользователи без исключения'),
      option('guest', 'Guest'),
    ],
  },
  {
    id: 'entry', label: 'Что подтверждено как первоначальный доступ?', options: [
      option('vpn', 'Успешный внешний вход svc_archive через VPN с MFA bypass', true),
      option('email', 'Фишинговое письмо'),
      option('usb', 'USB-накопитель'),
    ],
  },
  {
    id: 'critical', label: 'Что пока не подтверждено?', options: [
      option('db', 'Доступ к DB-CORE-01 и изменение расчётных записей', true),
      option('process', 'Запуск relay.exe'),
      option('jump', 'Вход на OPS-JUMP-01'),
    ],
  },
] as const;

export const containmentSections = [
  {
    id: 'evidence', label: 'Перед активной локализацией', options: [
      option('capture', 'Снять volatile-данные, экспортировать EDR/SIEM и зафиксировать текущее состояние', true),
      option('delete', 'Удалить cache.dat и очистить журналы'),
      option('reboot-all', 'Перезагрузить все узлы'),
    ],
  },
  {
    id: 'identity', label: 'Сервисная учётка и токены', options: [
      option('disable', 'Отключить svc_archive, отозвать сессии и запретить старые токены', true),
      option('password-only', 'Только сменить пароль'),
      option('wait', 'Оставить до конца расследования без ограничений'),
    ],
  },
  {
    id: 'hosts', label: 'Затронутые узлы', options: [
      option('selective', 'Изолировать GW-PAY-02 и OPS-JUMP-01, ограничить ARCHIVE-03, не глушить чистые узлы', true),
      option('shutdown', 'Выключить весь дата-центр'),
      option('gateway-only', 'Изолировать только gateway и игнорировать остальные совпадения'),
    ],
  },
  {
    id: 'network', label: 'Внешний индикатор', options: [
      option('block', 'Заблокировать 198.51.100.44 на egress и добавить контроль повторных обращений', true),
      option('dns-all', 'Отключить весь DNS'),
      option('internet-off', 'Навсегда отключить интернет всему контуру'),
    ],
  },
  {
    id: 'service', label: 'Расчётный сервис', options: [
      option('failover', 'Перевести трафик на проверенный резервный gateway и проверить целостность операций', true),
      option('ignore', 'Оставить заражённый gateway в работе'),
      option('wipe-live', 'Переустановить gateway прямо под нагрузкой'),
    ],
  },
] as const;

export const eradicationObjectives = [
  {
    id: 'account', title: 'Отключи скомпрометированную учётку',
    command: 'idp disable-user svc_archive --reason IR-GL-8841',
    output: 'user=svc_archive status=disabled active_sessions=3 revoked=3 audit=IR-GL-8841',
  },
  {
    id: 'token', title: 'Отзови связанный refresh token',
    command: 'idp revoke-token gl_rt_27a1 --cascade',
    output: 'token=gl_rt_27a1 revoked=true child_access_tokens=4 sessions=2',
  },
  {
    id: 'persistence-win', title: 'Удали закрепление на jump-host',
    command: 'edr remediate --host OPS-JUMP-01 --artifact "C:\\ProgramData\\cache.dat" --task CacheTelemetry',
    output: 'host=OPS-JUMP-01 file_quarantined=true scheduled_task_removed=true hash=7d21...91ab',
  },
  {
    id: 'persistence-linux', title: 'Удали посторонний systemd timer',
    command: 'irctl remediate --host ARCHIVE-03 --unit archive-sync.timer --preserve-copy',
    output: 'host=ARCHIVE-03 unit_disabled=true preserved=/evidence/ARCHIVE-03/archive-sync.timer.sha256',
  },
  {
    id: 'root-cause', title: 'Закрой первоначальную причину',
    command: 'vpn policy set service-accounts password-auth=deny mfa-bypass=deny',
    output: 'policy updated: service accounts require certificate auth; legacy password and bypass paths disabled',
  },
] as const;

export const recoverySections = [
  {
    id: 'source', label: 'Источник восстановления', options: [
      option('known-good', 'Проверенный образ до инцидента с подтверждённым хэшем и актуальными патчами', true),
      option('infected', 'Копия заражённого диска'),
      option('unknown', 'Любой ближайший snapshot без проверки'),
    ],
  },
  {
    id: 'return', label: 'Возврат сервисов', options: [
      option('staged', 'Поэтапный возврат: резерв → тесты → ограниченный трафик → полный трафик', true),
      option('all-at-once', 'Вернуть всё сразу'),
      option('never', 'Не возвращать сервисы вообще'),
    ],
  },
  {
    id: 'validation', label: 'Что проверяется до открытия?', options: [
      option('checks', 'Здоровье сервиса, целостность данных, новые учётные данные, EDR и журналирование', true),
      option('ping', 'Только ping'),
      option('visual', 'Только открывается ли главная страница'),
    ],
  },
  {
    id: 'monitor', label: 'Что делать после возврата?', options: [
      option('heightened', 'Усиленный мониторинг индикаторов, учётки и похожих техник минимум несколько циклов', true),
      option('close', 'Сразу закрыть инцидент'),
      option('delete-alerts', 'Удалить старые алерты'),
    ],
  },
] as const;

export const independentCommands = [
  {
    id: 'new-alert', command: 'siem search alert_id=GL-8897',
    output: '05:41:12 host=CI-RUNNER-02 user=buildbot event=token_use src=203.0.113.89\n05:41:18 process=curl target=secrets.greylock.local/api/export result=200',
  },
  {
    id: 'token-audit', command: 'idp token-audit --user buildbot --since 04:00',
    output: 'token=ci_pat_991 created=2026-06-02 last_used=05:41:18 src=203.0.113.89 scopes=secrets:read artifacts:write rotation=never',
  },
  {
    id: 'runner-tree', command: 'edr process-tree --host CI-RUNNER-02 --time 05:41',
    output: 'runner.exe(2012)\n  build.sh(2110)\n    curl(2177) -H "Authorization: Bearer ci_pat_991" https://secrets.greylock.local/api/export',
  },
  {
    id: 'repo-search', command: 'repo search "ci_pat_991" --all-history',
    output: 'commit=4b71a2 path=.ci/legacy-deploy.yml line=18 value=${CI_PAT_991}\ncommit author=ops-temp status=deleted_from_head present_in_history=true',
  },
  {
    id: 'revoke', command: 'idp revoke-token ci_pat_991 --cascade',
    output: 'token=ci_pat_991 revoked=true child_sessions=1 audit=IR-GL-8897',
  },
  {
    id: 'scope', command: 'siem search "ci_pat_991 OR 203.0.113.89" group_by=asset',
    output: 'CI-RUNNER-02 hits=9\nSECRETS-01 hits=4\nARTIFACTS-02 hits=1\nother_assets hits=0',
  },
] as const;

export const independentQuestions = [
  {
    id: 'missed', label: 'Что пропустили после первой волны?', options: [
      option('ci-token', 'Долгоживущий CI-токен buildbot, оставшийся в истории репозитория', true),
      option('vpn', 'Старый VPN-пароль svc_archive'),
      option('dns', 'Обычный DNS-запрос'),
    ],
  },
  {
    id: 'affected', label: 'Какие системы требуют проверки?', options: [
      option('scope', 'CI-RUNNER-02, SECRETS-01 и ARTIFACTS-02', true),
      option('all', 'Все системы мира'),
      option('runner', 'Только CI-RUNNER-02'),
    ],
  },
  {
    id: 'cause', label: 'Почему удаление строки из текущей версии не решило проблему?', options: [
      option('history', 'Секрет остался в истории и сам токен не был отозван', true),
      option('cache', 'Из-за браузерного кэша'),
      option('hash', 'Из-за SHA-256'),
    ],
  },
] as const;

export const findingSections = [
  {
    id: 'entry', label: 'Первичный доступ', options: [
      option('vpn', 'Внешний вход сервисной учёткой svc_archive через слабую VPN-политику', true),
      option('email', 'Фишинг сотрудника'),
      option('unknown', 'Причина не установлена'),
    ],
  },
  {
    id: 'movement', label: 'Перемещение', options: [
      option('jump', 'OPS-JUMP-01 → GW-PAY-02 и ARCHIVE-03 с использованием сервисной учётки', true),
      option('none', 'Противник работал только на одном узле'),
      option('database', 'Подтверждён прямой доступ в базу'),
    ],
  },
  {
    id: 'impact', label: 'Что подтверждено по ущербу?', options: [
      option('limited', 'Внешняя передача с gateway подтверждена; изменение расчётных данных не подтверждено', true),
      option('all-money', 'Все средства украдены'),
      option('no-impact', 'Никакой активности не было'),
    ],
  },
  {
    id: 'recurrence', label: 'Причина второй волны', options: [
      option('pat', 'Неотозванный CI PAT в истории репозитория', true),
      option('same-account', 'svc_archive продолжила работать'),
      option('user-error', 'Пользователь снова открыл письмо'),
    ],
  },
] as const;

export const reportSections = [
  {
    id: 'timeline', label: 'Временная линия', options: [
      option('ordered', 'VPN-вход → jump-host → gateway/archive → внешний канал → containment → повторный CI-доступ', true),
      option('unordered', 'Список событий без времени'),
      option('single', 'Только первый алерт'),
    ],
  },
  {
    id: 'actions', label: 'Выполненные меры', options: [
      option('complete', 'Сбор evidence, отзыв учётки/токенов, точечная изоляция, удаление закрепления, восстановление и мониторинг', true),
      option('delete-file', 'Удаление одного файла'),
      option('shutdown', 'Отключение всего контура'),
    ],
  },
  {
    id: 'root', label: 'Коренные причины', options: [
      option('causes', 'Слабая VPN-политика, избыточные права сервисной учётки и неуправляемые долгоживущие токены', true),
      option('attacker', 'Только наличие атакующего'),
      option('user', 'Только ошибка одного пользователя'),
    ],
  },
  {
    id: 'followup', label: 'После инцидента', options: [
      option('lessons', 'Владелец действий, сроки, контроль выполнения, тест восстановления и новые detection use-cases', true),
      option('close', 'Закрыть тикет и забыть'),
      option('blame', 'Найти виноватого без изменения систем'),
    ],
  },
] as const;
