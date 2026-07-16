# FALSE ACCESS 0.6.0 PATCH

Распаковать поверх версии 0.5.3 с заменой файлов.

После распаковки:

```powershell
cd C:\FalseAccess
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci --no-audit --no-fund
npm run build
```
