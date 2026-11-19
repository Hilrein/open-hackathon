# API сдачи и просмотра работ

## Эндпоинты

- `GET /api/hackathons/[slug]/submission` — получить свою работу (или работу своей команды).
- `PUT /api/hackathons/[slug]/submission` — сдать или обновить работу.
- `DELETE /api/hackathons/[slug]/submission` — отозвать работу (пока хакатон не завершён).
- `GET /api/hackathons/[slug]/submissions` — список всех работ хакатона для организатора.

## Личные и командные работы

- Работа может быть **личной** (`teamId: null`, `isTeamSubmission: false`) или **командной** (`teamId`, `teamName`, `isTeamSubmission: true`).
- Если участник состоит в команде, работа одна на всю команду:
  - сдавать, обновлять и отзывать работу может **только капитан** (`403` для остальных участников команды);
  - остальные участники команды видят работу через `GET /submission` только для чтения (`canEdit: false`).
- Если участник не состоит в команде, работа личная (`canEdit: true` при статусе `active`).
- При роспуске команды её работа удаляется каскадно.
- В публичных результатах (`/hackathons/[slug]/results`) у командной работы в качестве автора отображается название команды (`teamName`).

## Новые поля DTO

- `SubmissionDTO`: `teamId`, `teamName`, `isTeamSubmission`, `canEdit`.
- `OrganizerSubmissionDTO`: `teamId`, `teamName`, `isTeamSubmission`.

## Пример ответа с командной работой (`200 OK`)

```json
{
  "submission": {
    "id": "...",
    "hackathonSlug": "ai-assistants-2026",
    "title": "Командный ассистент",
    "description": "Подробное описание командного проекта...",
    "repoUrl": "https://github.com/example/team-project",
    "demoUrl": "https://demo.example.com",
    "createdAt": "2026-11-20T00:00:00.000Z",
    "updatedAt": "2026-11-20T00:05:00.000Z",
    "review": null,
    "teamId": "...",
    "teamName": "Код и кофе",
    "isTeamSubmission": true,
    "canEdit": true
  }
}
```
