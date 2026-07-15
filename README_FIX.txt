FALSE ACCESS — npm ci fix

Причина:
package-lock.json содержал ссылки на внутренний OpenAI npm registry:
packages.applied-caas-gateway*.internal.api.openai.org
GitHub Actions не имеет к нему доступа.

Применение:
1. Распаковать архив.
2. Открыть PowerShell в распакованной папке.
3. Выполнить:
   Set-ExecutionPolicy -Scope Process Bypass
   .\apply-fix.ps1

Скрипт рассчитан на C:\FalseAccess.
Другой путь:
   .\apply-fix.ps1 -ProjectPath "D:\Projects\FalseAccess"
