export const networkCaseOverview = [
  { label: 'CASE', value: 'BLACKWIRE-03' },
  { label: 'SITE', value: 'диспетчерский офис «Чёрной линии»' },
  { label: 'EDGE', value: 'EDGE-RTR-01 / 10.44.0.1' },
  { label: 'SEGMENTS', value: 'OFFICE / TERMINALS / CAMERAS' },
  { label: 'SYMPTOM', value: 'часть узлов получает другой gateway и DNS' },
  { label: 'STATE', value: 'критичные платежи переведены на резервный канал' },
] as const;

export const networkTopology = [
  { id: 'wan', title: 'UPLINK', subtitle: 'провайдер', address: '100.64.12.18/30', role: 'WAN', state: 'up' },
  { id: 'edge', title: 'EDGE-RTR-01', subtitle: 'маршрутизация / DHCP / NAT', address: '10.44.0.1', role: 'ROUTER', state: 'warning' },
  { id: 'dns', title: 'DNS-01', subtitle: 'внутренний резолвер', address: '10.44.0.53', role: 'DNS', state: 'up' },
  { id: 'office', title: 'VLAN 10', subtitle: 'операторы', address: '10.44.10.0/24', role: 'OFFICE', state: 'warning' },
  { id: 'terminals', title: 'VLAN 20', subtitle: 'платёжные терминалы', address: '10.44.20.0/24', role: 'TERMINALS', state: 'up' },
  { id: 'cameras', title: 'VLAN 30', subtitle: 'камеры / IoT', address: '10.44.30.0/24', role: 'CAMERAS', state: 'warning' },
] as const;

export const networkFoundationQuestions = [
  {
    id: 'gateway', label: 'Для чего рабочей станции нужен default gateway?', options: [
      { id: 'route', text: 'Чтобы отправлять пакеты в сети, которых нет в локальной подсети.', correct: true },
      { id: 'name', text: 'Чтобы превращать доменные имена в IP-адреса.' },
      { id: 'lease', text: 'Чтобы выдавать устройству адрес по DHCP.' },
    ],
  },
  {
    id: 'dns', label: 'Что делает DNS?', options: [
      { id: 'resolve', text: 'Связывает имя узла с IP-адресом и возвращает записи нужного типа.', correct: true },
      { id: 'encrypt', text: 'Шифрует весь трафик между устройствами.' },
      { id: 'nat', text: 'Подменяет частный адрес публичным при выходе в интернет.' },
    ],
  },
  {
    id: 'dhcp', label: 'Что обычно получает клиент от DHCP?', options: [
      { id: 'offer', text: 'IP-адрес, маску, gateway, DNS и срок аренды.', correct: true },
      { id: 'password', text: 'Пароль локального администратора.' },
      { id: 'route-all', text: 'Полную таблицу маршрутов всего провайдера.' },
    ],
  },
  {
    id: 'nat', label: 'Зачем на границе используют NAT?', options: [
      { id: 'translate', text: 'Чтобы сопоставлять частные внутренние адреса с адресом внешнего интерфейса.', correct: true },
      { id: 'detect', text: 'Чтобы автоматически находить вредоносные процессы.' },
      { id: 'dns-cache', text: 'Чтобы хранить ответы DNS.' },
    ],
  },
] as const;

export const networkInterfacesOutput = `lo               UNKNOWN        127.0.0.1/8
wan0             UP             100.64.12.18/30
br-core          UP             10.44.0.1/24
vlan10           UP             10.44.10.1/24
vlan20           UP             10.44.20.1/24
vlan30           UP             10.44.30.1/24`;

export const networkRoutesOutput = `default via 100.64.12.17 dev wan0 proto static
10.44.0.0/24 dev br-core proto kernel scope link src 10.44.0.1
10.44.10.0/24 dev vlan10 proto kernel scope link src 10.44.10.1
10.44.20.0/24 dev vlan20 proto kernel scope link src 10.44.20.1
10.44.30.0/24 dev vlan30 proto kernel scope link src 10.44.30.1`;

export const networkDhcpOutput = `LEASE 10.44.10.27  MAC 38:2c:4a:91:7d:02  HOST OPS-WS-14   SERVER 10.44.0.1       ROUTER 10.44.10.1    DNS 10.44.0.53
LEASE 10.44.10.44  MAC 8c:47:be:12:ac:09  HOST DESK-04     SERVER 10.44.0.1       ROUTER 10.44.10.1    DNS 10.44.0.53
OFFER 10.44.10.27  MAC 38:2c:4a:91:7d:02  HOST OPS-WS-14   SERVER 10.44.10.254    ROUTER 10.44.10.254  DNS 10.44.10.254
OFFER 10.44.10.61  MAC 02:90:4f:22:11:08  HOST LAPTOP-07   SERVER 10.44.10.254    ROUTER 10.44.10.254  DNS 10.44.10.254`;

export const networkNeighborsOutput = `10.44.10.27 dev vlan10 lladdr 38:2c:4a:91:7d:02 REACHABLE
10.44.10.44 dev vlan10 lladdr 8c:47:be:12:ac:09 STALE
10.44.10.254 dev vlan10 lladdr 02:42:ac:11:00:fe REACHABLE
10.44.20.18 dev vlan20 lladdr 00:25:96:ff:10:18 REACHABLE
10.44.30.17 dev vlan30 lladdr 7c:8b:ca:77:30:17 STALE`;

export const networkTrustedDnsOutput = `; <<>> DiG 9.20 <<>> ledger.blackwire.local @10.44.0.53
;; ->>HEADER<<- opcode: QUERY, status: NOERROR
;; ANSWER SECTION:
ledger.blackwire.local. 60 IN A 10.44.20.9
;; SERVER: 10.44.0.53#53`;

export const networkRogueDnsOutput = `; <<>> DiG 9.20 <<>> ledger.blackwire.local @10.44.10.254
;; ->>HEADER<<- opcode: QUERY, status: NOERROR
;; ANSWER SECTION:
ledger.blackwire.local. 30 IN A 198.51.100.88
;; SERVER: 10.44.10.254#53`;

export const networkNatOutput = `table ip nat {
 chain postrouting {
  type nat hook postrouting priority srcnat; policy accept;
  ip saddr 10.44.10.0/24 oifname "wan0" masquerade
  ip saddr 10.44.20.0/24 oifname "wan0" masquerade
  ip saddr 10.44.30.0/24 oifname "wan0" masquerade  # legacy rule
 }
}

COUNTERS
10.44.10.27 -> 203.0.113.44:443 packets=84 bytes=119430
10.44.10.61 -> 203.0.113.44:443 packets=31 bytes=44810
10.44.30.17 -> 192.0.2.91:9443 packets=644 bytes=891202`;

export const networkSocketsOutput = `Netid State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
udp   UNCONN 0      0      0.0.0.0:67         0.0.0.0:*         users:(("dhcpd",pid=714,fd=7))
udp   UNCONN 0      0      10.44.0.53:53      0.0.0.0:*         users:(("named",pid=884,fd=16))
tcp   ESTAB  0      0      10.44.10.27:53188  203.0.113.44:443 users:(("browser",pid=3012,fd=42))
tcp   ESTAB  0      0      10.44.30.17:41771  192.0.2.91:9443 users:(("camera-agent",pid=0,fd=0))`;

export const networkGuidedObjectives = [
  {
    id: 'interfaces', title: 'Зафиксируй интерфейсы и подсети',
    explanation: 'Адрес интерфейса показывает, какие сети маршрутизатор считает локальными. /24 означает, что первые 24 бита задают сеть, а последний октет — узел.',
    command: 'ip -br addr', output: networkInterfacesOutput,
  },
  {
    id: 'routes', title: 'Проверь таблицу маршрутов',
    explanation: 'Таблица маршрутов отвечает на вопрос, куда отправлять пакет. Default route используется, когда более точного маршрута нет.',
    command: 'ip route', output: networkRoutesOutput,
  },
  {
    id: 'dhcp', title: 'Сравни DHCP-ответы',
    explanation: 'В одной сети должен быть известный DHCP-сервер. Второй OFFER с другим gateway и DNS может перенаправить весь трафик клиента.',
    command: 'cat /cases/blackwire-03/dhcp-events.log', output: networkDhcpOutput,
  },
  {
    id: 'neighbors', title: 'Свяжи IP с MAC-адресом',
    explanation: 'ARP/neighbor table связывает адрес канального уровня с IP внутри локальной сети. Так можно найти физический порт подозрительного устройства.',
    command: 'ip neigh show dev vlan10', output: networkNeighborsOutput,
  },
  {
    id: 'dns-trusted', title: 'Спроси доверенный DNS',
    explanation: 'Явный @server позволяет сравнить ответы разных резолверов. Внутреннее имя должно вести на внутренний адрес.',
    command: 'dig ledger.blackwire.local @10.44.0.53', output: networkTrustedDnsOutput,
  },
  {
    id: 'dns-rogue', title: 'Спроси второй DNS',
    explanation: 'Одинаковое имя возвращает внешний адрес только у 10.44.10.254. Это уже конкретное расхождение, а не догадка о «плохом интернете».',
    command: 'dig ledger.blackwire.local @10.44.10.254', output: networkRogueDnsOutput,
  },
  {
    id: 'nat', title: 'Проверь NAT и счётчики',
    explanation: 'NAT показывает, какие внутренние сети выпускаются наружу. Слишком широкое правило для камер нарушает сегментацию.',
    command: 'nft list table ip nat', output: networkNatOutput,
  },
  {
    id: 'sockets', title: 'Свяжи узлы с внешними соединениями',
    explanation: 'Список соединений показывает протокол, локальный адрес, удалённый адрес и порт. Порт описывает сервис, а не доказывает его безопасность.',
    command: 'ss -tupna', output: networkSocketsOutput,
  },
] as const;

export const networkProtocolQuestions = [
  {
    id: 'tcp', label: 'Как начинается нормальное TCP-соединение?', options: [
      { id: 'handshake', text: 'SYN → SYN/ACK → ACK. После этого стороны передают данные.', correct: true },
      { id: 'dns', text: 'QUERY → OFFER → ACK.' },
      { id: 'udp', text: 'UDP всегда начинает с SYN.' },
    ],
  },
  {
    id: 'udp', label: 'Почему DNS и DHCP часто используют UDP?', options: [
      { id: 'low', text: 'Небольшим запросам не всегда нужна отдельная TCP-сессия; приложение само обрабатывает повтор или таймаут.', correct: true },
      { id: 'secure', text: 'UDP автоматически шифрует пакет.' },
      { id: 'route', text: 'UDP работает только внутри одной подсети.' },
    ],
  },
  {
    id: 'port', label: 'Что означает удалённый порт 443?', options: [
      { id: 'service', text: 'Обычно HTTPS-сервис. Сам номер порта не доказывает, что соединение безопасно или разрешено.', correct: true },
      { id: 'malware', text: 'Любое соединение на 443 является вредоносным.' },
      { id: 'host', text: 'Это номер компьютера в подсети.' },
    ],
  },
  {
    id: 'subnet', label: 'Находятся ли 10.44.10.27/24 и 10.44.20.18/24 в одной подсети?', options: [
      { id: 'no', text: 'Нет. Сетевые части 10.44.10.0/24 и 10.44.20.0/24 различаются; трафик идёт через маршрутизатор.', correct: true },
      { id: 'yes', text: 'Да, потому что оба адреса начинаются с 10.' },
      { id: 'port', text: 'Это зависит только от номера порта.' },
    ],
  },
] as const;

export const networkDhcpCapture = `00:14:02.110 0.0.0.0:68       -> 255.255.255.255:67 DHCP Discover xid=0x91aa2014 chaddr=38:2c:4a:91:7d:02
00:14:02.119 10.44.0.1:67     -> 255.255.255.255:68 DHCP Offer yiaddr=10.44.10.27 router=10.44.10.1 dns=10.44.0.53 server=10.44.0.1
00:14:02.121 10.44.10.254:67  -> 255.255.255.255:68 DHCP Offer yiaddr=10.44.10.27 router=10.44.10.254 dns=10.44.10.254 server=10.44.10.254
00:14:02.127 0.0.0.0:68       -> 255.255.255.255:67 DHCP Request requested=10.44.10.27 server=10.44.10.254
00:14:02.131 10.44.10.254:67  -> 255.255.255.255:68 DHCP Ack yiaddr=10.44.10.27 lease=3600`;

export const networkDnsCapture = `00:14:09.304 10.44.10.27:53318  -> 10.44.10.254:53  A? ledger.blackwire.local
00:14:09.306 10.44.10.254:53   -> 10.44.10.27:53318 A 198.51.100.88 ttl=30
00:14:09.311 10.44.10.27:53319  -> 10.44.0.53:53     A? ledger.blackwire.local
00:14:09.313 10.44.0.53:53      -> 10.44.10.27:53319 A 10.44.20.9 ttl=60`;

export const networkTcpCapture = `00:14:10.020 10.44.10.27:53188 -> 203.0.113.44:443 Flags [S]   seq=140021 win=64240
00:14:10.061 203.0.113.44:443  -> 10.44.10.27:53188 Flags [S.] seq=881200 ack=140022 win=65160
00:14:10.062 10.44.10.27:53188 -> 203.0.113.44:443 Flags [.]   ack=881201
00:14:10.087 10.44.10.27:53188 -> 203.0.113.44:443 TLS ClientHello SNI=ledger.blackwire.local`;

export const networkCaptureObjectives = [
  {
    id: 'dhcp', title: 'Покажи только DHCP',
    explanation: 'Порты 67 и 68 используются сервером и клиентом DHCP. Фильтр убирает остальной шум из захвата.',
    command: `tcpdump -nn -r office.pcap 'udp port 67 or udp port 68'`, output: networkDhcpCapture,
  },
  {
    id: 'dns', title: 'Покажи DNS-ответы',
    explanation: 'Порт 53 помогает увидеть, какой сервер дал клиенту конкретный адрес. -nn запрещает обратное преобразование имён и сервисов.',
    command: `tcpdump -nn -r office.pcap 'udp port 53'`, output: networkDnsCapture,
  },
  {
    id: 'tcp', title: 'Проверь TCP-сессию',
    explanation: 'Флаги S и S. показывают рукопожатие. SNI в ClientHello указывает имя, к которому обращался клиент, даже если содержимое дальше зашифровано.',
    command: `tcpdump -nn -r office.pcap 'host 10.44.10.27 and tcp port 443'`, output: networkTcpCapture,
  },
] as const;

export const networkContainmentSections = [
  {
    id: 'evidence', label: 'Перед изменениями', options: [
      { id: 'save', text: 'Сохранить DHCP/DNS-захват, таблицу соседей, конфигурацию NAT и сведения о switch-port.', correct: true },
      { id: 'reboot', text: 'Сразу перезапустить роутер и коммутаторы.' },
      { id: 'delete', text: 'Удалить логи DHCP, чтобы клиенты получили новые адреса.' },
    ],
  },
  {
    id: 'rogue', label: 'Подозрительное устройство', options: [
      { id: 'port', text: 'Отключить конкретный порт/MAC 02:42:ac:11:00:fe и сохранить устройство для проверки.', correct: true },
      { id: 'udp', text: 'Заблокировать UDP во всей сети.' },
      { id: 'ignore', text: 'Оставить устройство, потому что оно отвечает быстрее доверенного DHCP.' },
    ],
  },
  {
    id: 'clients', label: 'Клиенты VLAN 10', options: [
      { id: 'renew', text: 'Вернуть доверенные DHCP-опции, обновить аренды и очистить DNS-кэш на затронутых узлах.', correct: true },
      { id: 'static', text: 'Назначить всем случайные статические адреса.' },
      { id: 'wipe', text: 'Переустановить все рабочие станции без проверки.' },
    ],
  },
  {
    id: 'segmentation', label: 'VLAN 30', options: [
      { id: 'egress', text: 'Убрать широкую NAT-запись и разрешить камерам только необходимые внутренние сервисы и утверждённые внешние адреса.', correct: true },
      { id: 'bridge', text: 'Объединить камеры с офисной сетью.' },
      { id: 'public', text: 'Выдать камерам публичные адреса для удобства.' },
    ],
  },
] as const;

export const networkIndependentCommands = [
  { id: 'vlans', command: 'show vlan brief', output: `VLAN10 OFFICE     ports swp1-swp12
VLAN20 TERMINALS  ports swp13-swp18
VLAN30 CAMERAS    ports swp19-swp28
VLAN99 MGMT       ports swp29` },
  { id: 'mac', command: 'show mac address-table vlan 30', output: `VLAN MAC               PORT
30   7c:8b:ca:77:30:17 swp24
30   7c:8b:ca:77:30:18 swp25
30   7c:8b:ca:77:30:19 swp26` },
  { id: 'acl', command: 'show access-lists CAMERAS-EGRESS', output: `10 permit udp 10.44.30.0/24 host 10.44.0.53 eq 53
20 permit udp 10.44.30.0/24 host 10.44.0.12 eq 123
90 permit ip 10.44.30.0/24 any   hits 18402  # TEMP-MIGRATION` },
  { id: 'flow', command: 'show flow source 10.44.30.17', output: `10.44.30.17:41771 -> 192.0.2.91:9443 tcp bytes=891202 packets=644 first=02:14:08 last=03:21:42` },
  { id: 'arp', command: 'show arp 10.44.30.17', output: `10.44.30.17 7c:8b:ca:77:30:17 vlan30 swp24 reachable` },
] as const;

export const networkIndependentQuestions = [
  {
    id: 'host', label: 'Какой узел выходит наружу?', options: [
      { id: 'camera17', text: '10.44.30.17, MAC 7c:8b:ca:77:30:17, порт swp24.', correct: true },
      { id: 'dns', text: '10.44.0.53, потому что это DNS.' },
      { id: 'all', text: 'Все камеры одинаково подтверждены.' },
    ],
  },
  {
    id: 'control', label: 'Какая настройка разрешила трафик?', options: [
      { id: 'permit', text: 'Широкое правило 90 permit ip 10.44.30.0/24 any с активными счётчиками.', correct: true },
      { id: 'vlan', text: 'Сам факт существования VLAN 30.' },
      { id: 'dns-rule', text: 'Разрешение DNS к 10.44.0.53.' },
    ],
  },
  {
    id: 'action', label: 'Безопасное первое ограничение', options: [
      { id: 'remove', text: 'Сохранить конфигурацию и flow, удалить широкое временное правило, оставить DNS/NTP и необходимые направления.', correct: true },
      { id: 'shutdown-all', text: 'Отключить весь офисный коммутатор.' },
      { id: 'allow', text: 'Разрешить любой исходящий HTTPS для всех IoT.' },
    ],
  },
] as const;

export const networkFindingSections = [
  {
    id: 'root', label: 'Причина сбоя VLAN 10', options: [
      { id: 'rogue-dhcp', text: 'Неизвестный узел 10.44.10.254 раздавал gateway и DNS, отличающиеся от утверждённых.', correct: true },
      { id: 'internet', text: 'Провайдер полностью отключил офис.' },
      { id: 'dns-only', text: 'Сломался только доверенный DNS 10.44.0.53.' },
    ],
  },
  {
    id: 'redirect', label: 'Подтверждённое перенаправление', options: [
      { id: 'answer', text: 'Ложный DNS вернул 198.51.100.88 вместо внутреннего 10.44.20.9; клиент затем установил TCP-сессию к внешнему узлу.', correct: true },
      { id: 'decrypt', text: 'Содержимое TLS полностью расшифровано и украдено.' },
      { id: 'password', text: 'Пароль оператора подтверждён как украденный.' },
    ],
  },
  {
    id: 'camera', label: 'Проблема VLAN 30', options: [
      { id: 'egress', text: 'Временное ACL/NAT-правило разрешило камерам произвольный внешний трафик; подтверждён узел 10.44.30.17.', correct: true },
      { id: 'same', text: 'Камеры получили адрес от того же rogue DHCP.' },
      { id: 'offline', text: 'Все камеры были отключены.' },
    ],
  },
] as const;

export const networkReportSections = [
  {
    id: 'scope', label: 'Масштаб', options: [
      { id: 'two', text: 'Подтверждены две разные проблемы: rogue DHCP/DNS в VLAN 10 и чрезмерный egress в VLAN 30.', correct: true },
      { id: 'entire', text: 'Полностью скомпрометирована вся сеть и все данные.' },
      { id: 'none', text: 'Технических проблем нет.' },
    ],
  },
  {
    id: 'evidence', label: 'Доказательства', options: [
      { id: 'set', text: 'DHCP OFFER/ACK, ARP/MAC, разные DNS-ответы, TCP handshake/SNI, NAT/ACL counters и flow.', correct: true },
      { id: 'ping', text: 'Только результат ping.' },
      { id: 'words', text: 'Только слова администратора.' },
    ],
  },
  {
    id: 'recommendation', label: 'Исправление', options: [
      { id: 'controls', text: 'DHCP snooping, port security, доверенные DNS/DHCP, точечные egress ACL, журналирование и контроль изменений.', correct: true },
      { id: 'flat', text: 'Убрать VLAN и сделать одну плоскую сеть.' },
      { id: 'block443', text: 'Навсегда заблокировать 443 во всей организации.' },
    ],
  },
  {
    id: 'unknown', label: 'Что пока не доказано', options: [
      { id: 'content', text: 'Содержимое зашифрованной TLS-сессии и факт кражи конкретных данных без дополнительных источников.', correct: true },
      { id: 'dhcp', text: 'Наличие второго DHCP-ответа.' },
      { id: 'flow', text: 'Внешнее соединение камеры.' },
    ],
  },
] as const;
