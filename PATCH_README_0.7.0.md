# FALSE ACCESS 0.7.0

Патч накладывается поверх версии `0.6.5` с сохранением структуры папок.

## Содержимое

- `IRONROOT-06` — глава по Active Directory и корпоративному домену;
- новая временная программа операции;
- миграция сохранений `v13 → v14`;
- два новых типа процедурных контрактов;
- обновлённые Skills, Missions, Career progression и PWA-кэш.

## Проверка

```powershell
cd C:\FalseAccess
npm ci --no-audit --no-fund
npm run build
```
