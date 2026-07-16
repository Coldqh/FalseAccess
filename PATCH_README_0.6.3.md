# FALSE ACCESS 0.6.3

Распаковать архив поверх версии 0.6.2 с заменой файлов.

```powershell
cd C:\FalseAccess

Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

npm ci --no-audit --no-fund
npm run build

git status
git add .
git commit -m "feat: add office network investigation campaign"
git push origin main
```
