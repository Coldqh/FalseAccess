# Патч FALSE ACCESS 0.8.0

Распаковать содержимое архива в корень `C:\FalseAccess` с заменой файлов.

Патч содержит только новые и изменённые файлы. Основной проект не дублируется.

После распаковки выполнить:

```powershell
cd C:\FalseAccess
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm ci --no-audit --no-fund
npm run build
```
