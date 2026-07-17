import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const passes = [];
const check = (condition, label, detail='') => (condition ? passes : failures).push({label, detail});

const pkg = JSON.parse(read('package.json'));
const versionJson = JSON.parse(read('public/version.json'));
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js').match(/const VERSION = '([^']+)'/)?.[1];
const app = read('src/system/updateManager.ts').match(/APP_VERSION = '([^']+)'/)?.[1];
const html = read('index.html').match(/const BUILD = '([^']+)'/)?.[1];
const versions = [pkg.version, versionJson.version, manifest.version, sw, app, html];
check(new Set(versions).size === 1 && versions[0] === '1.1.0', 'Версии синхронизированы', versions.join(' / '));

const foundation = read('src/data/foundationPractice.ts');
const ids = [...foundation.matchAll(/id: '(foundation-[0-3])', stage:/g)].map((m) => m[1]);
check(ids.length === 4 && new Set(ids).size === 4, 'Четыре foundation-модуля', ids.join(', '));
check(read('src/types.ts').includes("'practice'"), 'Practice зарегистрирован в AppId');
check(read('src/components/Desktop.tsx').includes('<PracticeApp />'), 'Practice подключён к desktop runtime');
check(read('src/system/ProgressContext.tsx').includes("false-access-progress-v23"), 'Миграция сохранений v23');
check(read('src/styles.css').includes('.practice-app') && read('src/styles.css').includes('@media(max-width:720px)'), 'Practice адаптирован под телефон');
check(read('src/system/updateManager.ts').includes('2400'), 'Update check имеет жёсткий таймаут');
check(read('src/styles.css').includes('.mail-app-v4.mobile-reader-open .mail-reader'), 'Mail mobile reading style сохранён');

const sourceFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) sourceFiles.push(full);
  }
}
walk(path.join(root, 'src'));
const occurrences = new Map();
const stringPattern = /(['"`])([^\n]{80,}?)\1/g;
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(stringPattern)) {
    const value = match[2].replace(/\s+/g, ' ').trim();
    if (!/[А-Яа-яЁё]/.test(value) || value.includes('${') || value.includes('className')) continue;
    const current = occurrences.get(value) ?? [];
    current.push(path.relative(root, file)); occurrences.set(value, current);
  }
}
const duplicates = [...occurrences.entries()].filter(([,files]) => files.length >= 3);
check(duplicates.length === 0, 'Нет длинных пользовательских фраз, повторённых 3+ раза', duplicates.map(([text,files])=>`${files.length}× ${text.slice(0,70)}`).join('; '));

for (const item of passes) console.log(`PASS  ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
for (const item of failures) console.error(`FAIL  ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`\nAudit: ${passes.length} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
