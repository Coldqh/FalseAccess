# PATCH 0.7.1

Распаковать архив поверх FALSE ACCESS 0.7.0 с заменой файлов.

Проверка:

```powershell
cd C:\FalseAccess
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci --no-audit --no-fund
npm run build
```
