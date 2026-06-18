# Чекпоинты проекта

Документ фиксирует текущее состояние реализации: что уже сделано, что проверено и что осталось сделать дальше.

## Текущий статус

Рабочий Electron/Vue/TypeScript лаунчер для Sirus WoW (**v1.0.15**). Есть полный UI с разделами, portable `core`, typed IPC/preload, unit tests, Windows packaging и публикация GitHub Releases через CI. Сборки **без code signing** — это осознанное решение.

## Сделано

### Документация и правила

- [План разработки](PROJECT_PLAN.md), [заметки по API](API_NOTES.md), [changelog](../CHANGELOG.md), [VERSION](../VERSION).
- Agent rules и skills в `.agents` (`backend`, `frontend`, `changelog`, `commit`).
- README с разделением реализованных возможностей и планов.

### Каркас и архитектура

- Electron + `electron-vite` + Vue 3 + TypeScript.
- Структура: `src/core`, `src/main`, `src/preload`, `src/renderer`, `src/shared`, `tests`.
- `core` без импортов Electron; IPC schema-first через Zod.
- Frontend-слои: `page -> block -> element -> component`.
- Локализация `ru/en`, **единственная тёмная тема**, CSP в renderer HTML.

### Core-модули

- `wow/wowPaths` — пути и валидация клиента (`run.exe`, `Data`, `Interface`, `WTF`).
- `accounts/configWtf` — патч `Config.wtf` с экранированием значений.
- `settings/launcherSettings` — нормализация настроек лаунчера.
- `github/githubAuth`, `github/sourceZip` — token helpers и URL source zip.
- `updater/appUpdate`, `updater/portableUpdateScript` — SemVer, GitHub Releases, portable update script.
- `backup/wtfBackup` — план backup/restore с safety backup.
- `fpsPatch/fpsPatch` — план установки, fallback URL, remote metadata.
- `clientPatches/clientPatches` — manifest API, fallback-источники, безопасные пути, MD5 compare.
- `addons/addons` — каталог, версии из `.toc`, SemVer/numeric compare.
- `mining/mining` — конфиг, валидация запуска, split аргументов.

### Electron backend (IPC)

- **App:** info, check/install update.
- **Settings:** get/save, выбор папки WoW через dialog.
- **GitHub token:** status/save/clear через `safeStorage`.
- **Accounts:** list/add/select; запись `Config.wtf` перед запуском с `.bak`.
- **Backup WTF:** list/create/restore/delete/open-folder.
- **FPS-патч:** status/install/delete.
- **Client patches:** list manifest, check, cancel check, download file, download all missing.
- **Addons:** list/check/install/delete/updateAll, custom add/export/import.
- **Mining:** getState/saveConfig/selectMinerPath/start/stop/resetStats.
- **WoW:** validatePath, preview account config, launch game.
- Persistent `settings.json`, encrypted secrets, MD5 cache клиента в `userData`.

### UI

- Layout: sidebar, header, footer, прокручиваемая рабочая область, Akatsuki background.
- **Главная:** плитки состояния, быстрые действия, проверка/обновление лаунчера, модалка пути при первом запуске.
- **Аддоны:** таблицы Sirus / community / custom, install/update/delete, hover-подсказки, import/export custom JSON.
- **Проверка клиента:** выбор зеркала, таблица файлов, cancel check, скачивание одного/всех проблемных файлов.
- **FPS-патч:** status/install/reinstall/delete, remote build/hash.
- **WTF:** create/restore/delete, open folder, индикация возраста бекапа на главной.
- **Майнинг:** конфиг, примеры кошельков, start/stop, остановка перед launch.
- **Настройки:** путь WoW, launch behavior toggles, GitHub token (modal + guide).
- **Аккаунты:** dropdown в header, модалка add/login/password.
- **Сказать спасибо:** карточки поддержки.

### CI и сборка

- GitHub Actions: `npm run check`, `npm run build`, `npm run package:win` на push с изменением `VERSION`.
- Публикация GitHub Release с `release/*.exe`, `.blockmap`, `latest.yml`.
- Windows NSIS installer (мастер с выбором папки) + portable, без подписи.

## Проверено

- `npm run check` проходит (typecheck web + node, Vitest).
- `npm run build` проходит.
- **19 test files, 81 tests** — все зелёные.
- Portable core test: `src/core` не импортирует Electron.

## Частично сделано

### GitHub token

**Сделано:** save/clear/status, encrypted storage, UI modal/form, fallback token для приватных release assets и addon downloads.

**Осталось:**

- проверка token через GitHub API;
- отображение rate limit в UI;
- явная обработка 401/403 при сохранении;
- adapter tests для secret storage.

### Backup `WTF`

**Сделано:** полный CRUD, zip/unzip adapters, safety backup перед restore, UI, integration tests.

**Осталось:**

- progress events;
- cancellation для долгих backup/restore;
- retention/лимиты для старых бекапов.

### FPS-патч

**Сделано:** install/delete, fallback download, remote metadata (`api.d1st4r.ru`), local hash compare, cross-device move fix, UI.

**Осталось:**

- progress events при скачивании;
- cancellation скачивания.

### Проверка и обновление клиента

**Сделано:** manifest fallback и rotation, MD5 cache, check/cancel, download one/all с post-download MD5, UI, auto-check при старте.

**Осталось:**

- progress events при MD5-check и bulk download;
- cancellation во время скачивания файлов (cancel check уже есть).

### Автообновление лаунчера

**Сделано:** GitHub Releases API, SemVer, asset selection (setup/portable), download + silent NSIS или portable replace, UI на главной, prerelease toggle.

**Осталось:**

- показ release notes перед установкой;
- checksum/signature verification артефактов, если появятся в релизе.

### Настройки и путь к WoW

**Сделано:** dialog, validation, dashboard tiles, first-run modal, settings persistence, core normalization tests.

**Осталось:**

- кнопка «открыть папку клиента» в проводнике;
- tests для file settings adapter (не только core normalize);
- явная обработка ошибок чтения/записи `settings.json`.

## Не начато

- **WeakAuras** — автообновление аур (только в плане).
- **Журнал операций** — отдельный экран логов/истории действий.
- **E2E** — Playwright smoke tests.
- **Code signing** — сознательно не делаем; SmartScreen-предупреждения ожидаемы.

## Следующие шаги (приоритет)

1. GitHub token: API validation + rate limit в UI.
2. Progress/cancellation для WTF backup и client download.
3. Release notes перед установкой обновления лаунчера.
4. Открытие папки клиента WoW из UI.
5. WeakAuras — отдельный design doc и реализация.
6. Playwright smoke: first launch, wow path, launch game.

## Известные риски

- `esbuild` закрыт override до 0.28.1; следить за advisories в цепочке `vite/electron-vite`.
- GitHub token и пароли аккаунтов нельзя логировать; `safeStorage` надо проверять на целевых Windows-машинах.
- Строка `SET readTerminationWithoutNotice` в `Config.wtf` требует подтверждения на реальном клиенте Sirus.
- Неподписанные `.exe` могут блокироваться SmartScreen — пользователю нужен обход через «Подробнее → Выполнить в любом случае».

## Последний зелёный прогон

- `npm run check` — успешно, **19 test files, 81 tests**.
- `npm run build` — успешно (проверено ранее в CI и локально).
