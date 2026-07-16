# FALSE ACCESS 0.6.4

Патч накладывается поверх версии 0.6.3 с заменой файлов.

После распаковки:

```powershell
cd C:\FalseAccess
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci --no-audit --no-fund
npm run build
git add .
git commit -m "feat: add Web API and SQL investigation campaign"
git push origin main
```
