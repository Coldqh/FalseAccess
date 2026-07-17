# FALSE ACCESS — Act 2 / Маршрут

## Три слоя

1. `marshrut-investigation-01` — guided mission: HTTP, sessions, JSONL, read-only SQL, timeline и границы передачи данных.
2. Три seeded contracts — HTTP chain, session reuse, JSONL + SQL timeline без подсказок.
3. `marshrut-check-01` — неизвестная session anomaly: отделить штатную смену сети от reuse и подтвердить export.

## Безопасность

- только локальные synthetic exchanges;
- `http` работает только по captured request ids;
- `sql` разрешает только SELECT;
- внешние URL, destructive commands и запись в evidence заблокированы;
- cookie и персональные route data нельзя передавать как решение.

## Что заменено

Старый MARSHRUT-01 заменён evidence-based маршрутом. После mastery старые story flags выставляются только для совместимости и открытия Акта 3.
