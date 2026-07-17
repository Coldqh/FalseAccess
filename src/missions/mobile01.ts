export const mobileCaseOverview = [
  { label: 'УСТРОЙСТВО', value: 'COURIER-A13 / Android 15' },
  { label: 'ИНЦИДЕНТ', value: 'телефон вернули через 2 часа' },
  { label: 'СИМПТОМ', value: 'ночью выгружены маршруты' },
  { label: 'РЕЖИМ', value: 'образ + синтетические журналы' },
] as const;

export const mobileArchitecture = [
  { id: 'app', role: 'APP', title: 'Courier', subtitle: 'маршруты и задания', address: 'com.northline.courier' },
  { id: 'os', role: 'OS', title: 'Android', subtitle: 'permissions / appops', address: 'COURIER-A13' },
  { id: 'mdm', role: 'CONTROL', title: 'MDM', subtitle: 'корпоративный профиль', address: 'northline-mdm' },
  { id: 'oauth', role: 'IDENTITY', title: 'OAuth', subtitle: 'refresh / access tokens', address: 'auth.northline.local' },
] as const;

export const mobileFoundationQuestions = [
  {
    id: 'permission', label: 'Что означает разрешение приложения?', options: [
      { id: 'a', text: 'Право использовать конкретную возможность или данные ОС.', correct: true },
      { id: 'b', text: 'Доказательство, что приложение безопасно.' },
      { id: 'c', text: 'Пароль пользователя от телефона.' },
    ],
  },
  {
    id: 'special', label: 'Почему Accessibility и Device Admin проверяются отдельно?', options: [
      { id: 'a', text: 'Это специальные полномочия, которые дают больше контроля, чем обычные runtime-разрешения.', correct: true },
      { id: 'b', text: 'Они отвечают только за внешний вид интерфейса.' },
      { id: 'c', text: 'Они доступны только системным приложениям и не требуют проверки.' },
    ],
  },
  {
    id: 'token', label: 'Что делает refresh token?', options: [
      { id: 'a', text: 'Позволяет получить новый access token без повторного ввода пароля.', correct: true },
      { id: 'b', text: 'Шифрует весь диск телефона.' },
      { id: 'c', text: 'Хранит PIN-код SIM-карты.' },
    ],
  },
] as const;

export const mobileGuidedObjectives = [
  { id: 'packages', title: 'Список сторонних пакетов', command: 'adb shell pm list packages -3', output: 'package:com.northline.courier\npackage:com.orbit.notes\npackage:org.signal.secure' },
  { id: 'package', title: 'Манифест подозрительного пакета', command: 'adb shell dumpsys package com.orbit.notes', output: 'firstInstallTime=2026-04-21 02:11:34\ninstallerPackageName=com.android.packageinstaller\nrequested permissions:\n  android.permission.READ_CONTACTS\n  android.permission.RECORD_AUDIO\n  android.permission.ACCESS_FINE_LOCATION\n  android.permission.REQUEST_INSTALL_PACKAGES' },
  { id: 'appops', title: 'Фактически выданные доступы', command: 'adb shell appops get com.orbit.notes', output: 'READ_CONTACTS: allow\nRECORD_AUDIO: allow\nFINE_LOCATION: allow\nMONITOR_LOCATION: allow; background' },
  { id: 'accessibility', title: 'Активная Accessibility-служба', command: 'adb shell settings get secure enabled_accessibility_services', output: 'com.orbit.notes/.OrbitAccessibility' },
  { id: 'admin', title: 'Администраторы устройства', command: 'adb shell dumpsys device_policy', output: 'Active admin: com.northline.mdm/.AdminReceiver\nActive admin: com.orbit.notes/.OrbitAdminReceiver\n  added=2026-04-21 02:13:09' },
  { id: 'network', title: 'Сетевые события приложения', command: 'cat evidence/network.log', output: '02:16:42 com.orbit.notes -> 198.51.100.61:443 TLS SNI=relay-cache.test\n02:17:04 com.orbit.notes -> 198.51.100.61:443 sent=48192 recv=2201' },
] as const;

export const mobileSessionQuestions = [
  {
    id: 'package-source', label: 'Что подтверждает происхождение Orbit Notes?', options: [
      { id: 'a', text: 'Установлено локальным package installer ночью, а не корпоративным MDM.', correct: true },
      { id: 'b', text: 'Приложение установлено из официального корпоративного каталога.' },
      { id: 'c', text: 'Источник установки определить невозможно.' },
    ],
  },
  {
    id: 'privilege', label: 'Какой факт сильнее всего показывает закрепление?', options: [
      { id: 'a', text: 'Orbit Notes получило Accessibility и Device Admin.', correct: true },
      { id: 'b', text: 'Приложение запросило доступ к геолокации.' },
      { id: 'c', text: 'У приложения есть иконка заметок.' },
    ],
  },
  {
    id: 'network', label: 'Что подтверждает network.log?', options: [
      { id: 'a', text: 'Пакет установил TLS-соединение с 198.51.100.61 и передал данные.', correct: true },
      { id: 'b', text: 'Удалённый сервер обязательно управлял телефоном.' },
      { id: 'c', text: 'Переданы именно маршруты всех курьеров.' },
    ],
  },
] as const;

export const mobileBackupObjectives = [
  { id: 'manifest', title: 'Содержимое резервной копии', command: 'cat evidence/backup/manifest.txt', output: 'apps/com.northline.courier/databases/routes.db\napps/com.northline.courier/shared_prefs/session.xml\napps/com.orbit.notes/files/cache.bin' },
  { id: 'session', title: 'Токен в SharedPreferences', command: 'cat evidence/backup/apps/com.northline.courier/shared_prefs/session.xml', output: '<map>\n  <string name="account">courier-17</string>\n  <string name="refresh_token">rt_courier_71d9</string>\n</map>' },
  { id: 'oauth', title: 'Использование токена', command: 'grep "rt_courier_71d9" evidence/auth.log', output: '03:04:12 refresh_token=rt_courier_71d9 ip=203.0.113.77 result=access_issued\n03:04:19 account=courier-17 ip=203.0.113.77 POST /routes_export 200' },
] as const;

export const mobileTokenQuestions = [
  {
    id: 'chain', label: 'Какая цепочка доказана?', options: [
      { id: 'a', text: 'Backup содержал refresh token; затем токен использовали с 203.0.113.77 и выгрузили маршруты.', correct: true },
      { id: 'b', text: 'Orbit Notes само отправило маршруты на 203.0.113.77.' },
      { id: 'c', text: 'Пароль курьера был подобран перебором.' },
    ],
  },
  {
    id: 'response', label: 'Первое действие с украденным refresh token?', options: [
      { id: 'a', text: 'Отозвать refresh token и все созданные через него сессии.', correct: true },
      { id: 'b', text: 'Удалить auth.log.' },
      { id: 'c', text: 'Сменить PIN-код экрана и больше ничего не делать.' },
    ],
  },
] as const;

export const mobileVulnerablePatch = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.READ_SMS" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <application
      android:allowBackup="true"
      android:usesCleartextTraffic="true">
  </application>
</manifest>

// SessionStore.kt
val prefs = context.getSharedPreferences("session", Context.MODE_PRIVATE)
prefs.edit().putString("refresh_token", token).apply()
`;

export const mobileSecurePatch = `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <application
      android:allowBackup="false"
      android:dataExtractionRules="@xml/data_extraction_rules"
      android:usesCleartextTraffic="false">
  </application>
</manifest>

<!-- res/xml/data_extraction_rules.xml -->
<data-extraction-rules>
  <cloud-backup><exclude domain="sharedpref" path="session.xml" /></cloud-backup>
  <device-transfer><exclude domain="sharedpref" path="session.xml" /></device-transfer>
</data-extraction-rules>

// SessionCipher.kt — Android Keystore, AES-GCM
val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
if (!keyStore.containsAlias("session_key")) {
  val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
  generator.init(KeyGenParameterSpec.Builder(
    "session_key",
    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
  ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
   .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
   .build())
  generator.generateKey()
}
val cipher = Cipher.getInstance("AES/GCM/NoPadding")
// Храни ciphertext и IV. Refresh token не сохраняй в открытом SharedPreferences.
`;

export const mobileCodeQuestions = [
  {
    id: 'backup', label: 'Почему одного allowBackup=false недостаточно как архитектурного объяснения?', options: [
      { id: 'a', text: 'На новых Android нужно явно управлять cloud backup и device transfer через dataExtractionRules и исключать секретные файлы.', correct: true },
      { id: 'b', text: 'Потому что allowBackup управляет только фотографиями.' },
      { id: 'c', text: 'Потому что backup вообще нельзя контролировать.' },
    ],
  },
  {
    id: 'storage', label: 'Что исправляет Android Keystore?', options: [
      { id: 'a', text: 'Ключ шифрования создаётся и используется через системное хранилище; приложение хранит ciphertext и IV, а не открытый refresh token.', correct: true },
      { id: 'b', text: 'Токен перестаёт существовать на сервере.' },
      { id: 'c', text: 'Приложение автоматически получает Device Admin.' },
    ],
  },
] as const;

export const mobileContainmentSections = [
  { id: 'first', label: 'Первый порядок действий', options: [
    { id: 'a', text: 'Изолировать сеть, сохранить образ и журналы, зафиксировать состояние.', correct: true },
    { id: 'b', text: 'Сразу выполнить factory reset.' },
    { id: 'c', text: 'Открыть подозрительное приложение и войти в него.' },
  ] },
  { id: 'tokens', label: 'Работа с учётной записью', options: [
    { id: 'a', text: 'Отозвать refresh token, access tokens и связанные сессии.', correct: true },
    { id: 'b', text: 'Удалить только cookie браузера на телефоне.' },
    { id: 'c', text: 'Оставить токен активным для наблюдения без согласования.' },
  ] },
  { id: 'package', label: 'Работа с Orbit Notes', options: [
    { id: 'a', text: 'После фиксации доказательств снять Device Admin и Accessibility, затем удалить пакет.', correct: true },
    { id: 'b', text: 'Удалить пакет до снятия образа.' },
    { id: 'c', text: 'Только скрыть иконку приложения.' },
  ] },
  { id: 'fleet', label: 'Проверка масштаба', options: [
    { id: 'a', text: 'Искать пакет, подпись, IP, домен и профиль по всему парку устройств.', correct: true },
    { id: 'b', text: 'Проверить только этот телефон.' },
    { id: 'c', text: 'Проверить только список контактов курьера.' },
  ] },
] as const;

export const mobileIndependentCommands = [
  { id: 'inventory', command: 'cat second-device/inventory.json', output: '{"device":"OPS-IOS-08","os":"iOS 19.1","owner":"dispatcher-08","managed":true}' },
  { id: 'profiles', command: 'cat second-device/profiles.txt', output: 'com.northline.mdm signed=true\ncom.trustrelay.vpn signed=false endpoint=203.0.113.84' },
  { id: 'backup', command: 'cat second-device/backup_manifest.txt', output: 'encrypted=false\ncontains=KeychainExport/session-cache.json\nrefresh_token=rt_ops_82a1' },
  { id: 'oauth', command: 'cat second-device/oauth.log', output: '04:18:07 token=rt_ops_82a1 ip=203.0.113.84 result=access_issued\n04:18:14 account=dispatcher-08 POST /dispatch/export 200' },
  { id: 'network', command: 'cat second-device/network.log', output: '04:17:58 tunnel profile=com.trustrelay.vpn remote=203.0.113.84\n04:18:15 upload bytes=118044 remote=203.0.113.84' },
] as const;

export const mobileIndependentQuestions = [
  {
    id: 'profile', label: 'Что является подозрительным профилем?', options: [
      { id: 'a', text: 'Неподписанный VPN-профиль com.trustrelay.vpn.', correct: true },
      { id: 'b', text: 'Подписанный корпоративный MDM.' },
      { id: 'c', text: 'Профилей на устройстве нет.' },
    ],
  },
  {
    id: 'proof', label: 'Что связывает профиль, токен и выгрузку?', options: [
      { id: 'a', text: 'Один IP 203.0.113.84 присутствует в VPN, OAuth и сетевой выгрузке.', correct: true },
      { id: 'b', text: 'Одинаковое имя владельца устройства.' },
      { id: 'c', text: 'Версия iOS 19.1.' },
    ],
  },
] as const;

export const mobileFindingSections = [
  { id: 'initial', label: 'Начальная точка', options: [
    { id: 'a', text: 'На Android ночью локально установили Orbit Notes и выдали специальные полномочия.', correct: true },
    { id: 'b', text: 'Телефон заражён через Bluetooth — это доказано.' },
    { id: 'c', text: 'Корпоративный MDM был взломан.' },
  ] },
  { id: 'session', label: 'Компрометация сессии', options: [
    { id: 'a', text: 'Refresh token попал в backup и использовался с внешнего IP.', correct: true },
    { id: 'b', text: 'Пароль был подобран.' },
    { id: 'c', text: 'Сессия не использовалась.' },
  ] },
  { id: 'ios', label: 'Второе устройство', options: [
    { id: 'a', text: 'Неподписанный VPN-профиль и незашифрованный backup связаны с внешней выгрузкой.', correct: true },
    { id: 'b', text: 'На iPhone подтверждён тот же Android-пакет.' },
    { id: 'c', text: 'Инцидент ограничен только Android.' },
  ] },
] as const;

export const mobileReportSections = [
  { id: 'scope', label: 'Масштаб', options: [
    { id: 'a', text: 'Подтверждены два затронутых устройства и две скомпрометированные мобильные сессии.', correct: true },
    { id: 'b', text: 'Затронуты все телефоны компании.' },
    { id: 'c', text: 'Затронуто только одно приложение.' },
  ] },
  { id: 'evidence', label: 'Сохранить', options: [
    { id: 'a', text: 'Образы, package/profile inventory, appops, Device Policy, backup manifests, OAuth и network logs.', correct: true },
    { id: 'b', text: 'Только скриншот домашнего экрана.' },
    { id: 'c', text: 'Удалить backup после чтения.' },
  ] },
  { id: 'fix', label: 'Исправление', options: [
    { id: 'a', text: 'Отозвать токены, убрать посторонние профили и пакеты, запретить backup сессий, шифровать локальное хранение и провести fleet hunt.', correct: true },
    { id: 'b', text: 'Сменить обои и PIN-код.' },
    { id: 'c', text: 'Отключить мобильный интернет навсегда.' },
  ] },
] as const;
