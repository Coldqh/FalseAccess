# FALSE ACCESS 0.6.3 — BLACKWIRE-03

## Новая глава

- расследование офисной сети из трёх VLAN;
- схема маршрутизатора, DNS, рабочих станций, терминалов и камер;
- IP-адреса, маски, gateway, DHCP, DNS и NAT;
- таблица маршрутов и ARP/neighbor table;
- сравнение доверенного и rogue DNS;
- анализ DHCP OFFER/ACK;
- чтение PCAP через учебный tcpdump;
- TCP handshake, UDP, порты и TLS SNI;
- поиск rogue DHCP/DNS по IP, MAC и switch-port;
- безопасная изоляция без отключения всего офиса;
- самостоятельное расследование VLAN камер;
- ACL, egress-фильтрация, flow и сегментация;
- итоговый отчёт по двум независимым проблемам.

## Прогресс

- экзамен `network-foundations`;
- развитие Networking, Incident Response, Security Engineering, Forensics и Operational Planning;
- новые повторяемые сетевые контракты;
- BLACKWIRE-03 — временное приложение и исчезает после завершения;
- миграция сохранений на `false-access-progress-v11`.

## Техническое

- версия приложения и PWA-кэша: `0.6.3`;
- старые сохранения 0.6.2 загружаются автоматически;
- `npm ci` и production build проверены на чистом наложении патча.
