<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Правила на будущее

При работе с проектом обязательно соблюдать `docs/AGENT_RULES.md` и `docs/UX_RULES.md`, а также следующие правила для всех задач, затрагивающих интерфейс:

- **Обязательное применение UI/UX-скиллов**: при любой задаче, меняющей страницы, компоненты, формы, навигацию, тексты или стили, необходимо прочитать и применить релевантные проектные скиллы из `.agents/skills/`:
  - `.agents/skills/ux-simple-first/SKILL.md`
  - `.agents/skills/ui-audit/SKILL.md`
  - `.agents/skills/design-system/SKILL.md`
  - `.agents/skills/accessibility/SKILL.md`
  - `.agents/skills/forms-ux/SKILL.md`
  - `.agents/skills/responsive/SKILL.md`
- **Прозрачная отчётность**: в отчёте по задаче обязательно указывать, какие скиллы применены и какие пункты их чек-листов проверены.
- **Никаких скрытых изменений логики**: не менять бизнес-логику, API, права доступа, валидацию или схему БД под видом улучшения интерфейса.
- **Только токены, без хардкода**: новые цвета, радиусы, шрифты и размеры брать из проектных токенов (`src/app/globals.css`) и компонентов `src/components/ui/*`; не хардкодить цвета (`#hex`, `rgb()`, палитровые классы `emerald-*`/`amber-*` и т.п.) и произвольные размеры в обход токенов.
