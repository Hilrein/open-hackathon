---
name: design-system
description: Правила дизайн-системы open-hackathon: использование CSS-токенов цвета, типографики, отступов, радиусов и теней из globals.css, семантические цвета статусов и форматов, единые варианты кнопок и бейджей, запрет хардкода.
---

# Design System — токены и компонентная система

Проектный скилл по единой визуальной системе `open-hackathon` на базе Tailwind CSS v4 (`@theme inline` в `src/app/globals.css`) и примитивов `src/components/ui/*`.

## Когда применять

- При добавлении или правке любых цветов, фонов, рамок, шрифтов, радиусов, теней и отступов.
- При работе со статусами хакатонов, форматами проведения, бейджами, кнопками, алертами и полями ввода.
- При ревью PR/диффов на предмет захардкоженных значений в обход токенов.

## Чек-лист проверки

### 1. Токены цвета, типографики, отступов, радиусов и теней
- [ ] Цвета поверхностей и текста берутся только из токенов `src/app/globals.css`:
  - поверхности: `bg-background`, `bg-card`, `bg-popover`, `bg-muted`, `bg-secondary`, `bg-accent`;
  - текст: `text-foreground`, `text-card-foreground`, `text-muted-foreground`, `text-primary-foreground`, `text-secondary-foreground`, `text-accent-foreground`, `text-destructive`;
  - границы и фокус: `border-border`, `border-input`, `outline-ring`, `ring-ring`.
- [ ] Типографика использует проектные шрифты `--font-sans` (`font-sans`) и `--font-mono` (`font-mono` для кодов приглашения и технических идентификаторов) и стандартную шкалу Tailwind (`text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`).
- [ ] Радиусы скругления используют токенную шкалу `--radius` (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-4xl`), без произвольных `rounded-[...]`.
- [ ] Тени используют стандартные ступени (`shadow-xs`, `shadow-sm`, `shadow-md`) и не смешиваются хаотично в однотипных карточках.
- [ ] Отступы следуют базовой сетке 4px (`gap-2`, `gap-3`, `gap-4`, `gap-6`, `p-4`, `p-5`, `p-6`).

### 2. Семантические цвета статусов и форматов
- [ ] Статусы хакатона отображаются исключительно через токены `--status-upcoming`, `--status-active`, `--status-finished` и конфиг `HACKATHON_STATUS_CONFIG` из `src/lib/hackathon-formatters.ts`.
- [ ] Форматы проведения отображаются исключительно через токены `--format-online`, `--format-offline`, `--format-hybrid` и конфиг `HACKATHON_FORMAT_CONFIG` из `src/lib/hackathon-formatters.ts`.
- [ ] Если требуется новый семантический цвет (например, `--success` или `--warning` для уведомлений), он сначала добавляется в `:root` и `@theme inline` в `src/app/globals.css`, а не подменяется палитрой `emerald-*` / `amber-*` или цветом `primary`.

### 3. Единые варианты кнопок и бейджей
- [ ] Для кнопок и ссылок-кнопок используются `Button` и `buttonVariants` из `src/components/ui/button.tsx` с чёткой семантикой вариантов:
  - `default` — единственное главное действие на экране/в форме;
  - `outline` — второстепенное действие;
  - `secondary` — мягкое вспомогательное действие;
  - `ghost` — навигационные и ненавязчивые действия;
  - `destructive` — удаление, отзыв, роспуск;
  - `link` — текстовая ссылка.
- [ ] Размеры кнопок согласованы на уровне компонента (учитывая тач-цель `min-h-11` для основных действий), а не копируются вручную в десятках мест разными наборами `px-*`/`min-h-*`.
- [ ] Для меток и статусов используется `Badge` из `src/components/ui/badge.tsx` без хаотичного переопределения внутренних отступов и шрифтов на каждой странице.
- [ ] Для однотипных контролов (`textarea`, `select`) используются общие переиспользуемые стили или UI-компоненты, согласованные с `Input`.

### 4. Запрет хардкода цветов и размеров в обход токенов
- [ ] В `src/components/*` и `src/app/*` нет сырых hex/rgb/hsl значений (`#...`, `rgb(...)`, `hsl(...)`) — они допустимы только в объявлении переменных `:root` в `src/app/globals.css`.
- [ ] Нет хардкода палитровых классов Tailwind (`bg-blue-500`, `text-emerald-600`, `bg-amber-100`, `text-red-500`, `border-gray-200`, `bg-slate-50`) в обход семантических токенов.
- [ ] Нет произвольных размеров в квадратных скобках (`text-[13px]`, `ring-[3px]`, `rounded-[10px]`, `w-[340px]`), если в системе уже есть стандартный токен или утилита.

## Критерии приёмки

- Поиск по `src/components` и `src/app` не выявляет новых захардкоженных hex/rgb/hsl и палитровых классов Tailwind.
- Все статусы и форматы рендерятся через `HACKATHON_STATUS_CONFIG` и `HACKATHON_FORMAT_CONFIG`.
- Кнопки, бейджи, карточки и поля ввода используют единые варианты из `src/components/ui/*` без несогласованных локальных переопределений.

## Явные запреты

- Запрещено писать `#hex`, `rgb()`, `hsl()` и палитровые классы (`emerald-*`, `amber-*`, `red-*`, `blue-*`, `gray-*`, `slate-*`) в компонентах вместо семантических токенов.
- Запрещено дублировать классы цветов статусов и форматов вручную вместо импорта из `src/lib/hackathon-formatters.ts`.
- Запрещено красить сообщения об успехе цветом `destructive` или смешивать значения вариантов кнопок (`default` для второстепенного действия, `outline` для необратимого удаления без акцента).
- Запрещено задавать произвольные `text-[...]`, `rounded-[...]`, `ring-[...]` при наличии проектных токенов.

## Примеры из проекта

### Хорошие решения
- `src/app/globals.css` (строки 7–96): все базовые цвета, радиусы и доменные семантические токены (`--status-upcoming`, `--status-active`, `--status-finished`, `--format-online`, `--format-offline`, `--format-hybrid`) централизованы в `:root` и проброшены в `@theme inline`.
- `src/lib/hackathon-formatters.ts` (строки 3–43): единый источник правды для подписей и классов статусов и форматов (`border-status-active/30 bg-status-active/10 text-status-active` и аналоги), переиспользуемый в `hackathon-card.tsx` и `hackathon-manage-item.tsx`.
- `src/components/hackathon-card.tsx` (строки 39–136): полностью построена на семантических токенах (`bg-card`, `bg-muted/60`, `bg-accent/60`, `text-accent-foreground`, `text-muted-foreground`) без единого захардкоженного цвета.

### Проблемные решения (что нужно улучшать)
- `src/components/ui/button.tsx` (строки 21–33): базовые размеры кнопок (`default: h-8`, `lg: h-9`, `sm: h-7 text-[0.8rem]`) содержат произвольный `text-[0.8rem]` и меньше тач-цели 44px — из-за этого в `header-nav.tsx`, `user-menu.tsx`, `hackathon-manage-item.tsx`, `hackathons/page.tsx`, `submission-form.tsx`, `team-panel.tsx` и `create-hackathon-wizard.tsx` приходится вручную дописывать `min-h-11 px-4 text-base` на каждую кнопку.
- `src/components/submission-form.tsx` (строка 350) и `src/components/team-panel.tsx` (строка 477): успешный `Alert` окрашен через `border-primary/30 bg-primary/10` и `text-primary` из-за отсутствия отдельного семантического токена `--success` в `src/app/globals.css`.
- `src/components/submission-form.tsx` (строка 434): на `<textarea>` использованы `rounded-md` и произвольный `focus-visible:ring-[3px]`, тогда как в `src/components/create-hackathon-wizard.tsx` (строка 518) — `rounded-lg` и `focus-visible:ring-3`.
- `src/components/hackathon-card.tsx` (строки 51, 60) vs `src/components/hackathon-manage-item.tsx` (строки 110–115): один и тот же `Badge` со статусом/форматом в карточке каталога дополнительно переопределяется классами `px-2.5 py-0.5 text-xs font-medium`, а в кабинете организатора используется как есть.
- `src/app/hackathons/page.tsx` (строки 188, 205, 222): стили нативного `<select>` продублированы трижды инлайн-строкой классов вместо единого компонента дизайн-системы.
