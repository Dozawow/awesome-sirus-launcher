# awesome-sirus-launcher

Планируемый Electron/Vue лаунчер для Sirus WoW: аддоны с GitHub, проверка клиента по MD5, FPS-патч, бекапы `WTF` и запуск игры, автообновление WA.

## Документы

- [План разработки](docs/PROJECT_PLAN.md)
- [Чекпоинты проекта](docs/CHECKPOINTS.md)
- [Заметки по API](docs/API_NOTES.md)
- [Changelog](CHANGELOG.md)

## Команды

| Команда                  | Что делает                                                                    |
| ------------------------ | ----------------------------------------------------------------------------- |
| `npm install`            | Установить зависимости.                                                       |
| `npm run dev`            | Запустить лаунчер в dev-режиме.                                               |
| `npm start`              | То же самое, алиас для `npm run dev`.                                         |
| `npm run typecheck`      | Проверить TypeScript для renderer и main/preload/core.                        |
| `npm run typecheck:web`  | Проверить только Vue/renderer часть.                                          |
| `npm run typecheck:node` | Проверить main/preload/core/shared/tests.                                     |
| `npm test`               | Запустить unit tests один раз.                                                |
| `npm run test:watch`     | Запустить tests в watch-режиме.                                               |
| `npm run check`          | Полная быстрая проверка: typecheck + tests.                                   |
| `npm run build`          | Собрать Electron main/preload/renderer в `out/`.                              |
| `npm run preview`        | Запустить preview собранного приложения.                                      |
| `npm run package:dir`    | Собрать unpacked-приложение в `release/` без installer и без publish.         |
| `npm run package:win`    | Собрать Windows installer/portable artifacts без publish.                     |
| `npm run package`        | Собрать приложение через `electron-builder` без публикации в GitHub Releases. |

Обычный цикл разработки:

```bash
npm install
npm run dev
```

Проверка перед коммитом:

```bash
npm run check
npm run build
```

Проверка упаковки:

```bash
npm run package:dir
```

## Релизы и обновления

Релиз создается GitHub Actions при push в `main`/`master`, если меняется `VERSION`, `package.json`, lockfile или workflow. Workflow сверяет `VERSION` с `package.json`, собирает Windows artifacts и публикует GitHub Release с тегом `v<version>`.

Для нового теста обновления:

```bash
npm run check
npm run build
```

Затем подними версию в `VERSION`, `package.json` и `package-lock.json`, обнови `CHANGELOG.md`, сделай push в `main`/`master`. Лаунчер проверяет обновления через GitHub Releases.

## Agents

- [Правила разработки](.agents/rules/CODING_RULES.md)
- [Backend skill](.agents/skills/backend/SKILL.md)
- [Frontend skill](.agents/skills/frontend/SKILL.md)
- [Changelog skill](.agents/skills/changelog/SKILL.md)
- [Commit skill](.agents/skills/commit/SKILL.md)
