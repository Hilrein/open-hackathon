import "dotenv/config";
import { mockHackathons } from "../lib/mock-hackathons";
import { getDb } from "./index";
import { hackathons } from "./schema";

async function seed() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.error(
      "DATABASE_URL не задан. Скопируйте .env.example в .env и укажите строку подключения Neon."
    );
    process.exit(1);
  }

  const db = getDb();

  const rows = mockHackathons.map((mock) => ({
    slug: mock.id,
    title: mock.title,
    description: mock.description,
    startDate: new Date(mock.startDate),
    endDate: new Date(mock.endDate),
    location: mock.location,
    format: mock.format,
    status: mock.status,
    participantsCount: mock.participantsCount,
    maxParticipants: mock.maxParticipants ?? null,
    tags: mock.tags,
    prizePool: mock.prizePool ?? null,
    imageUrl: mock.imageUrl ?? null,
    organizerName: mock.organizerName,
  }));

  const inserted = await db
    .insert(hackathons)
    .values(rows)
    .onConflictDoNothing({ target: hackathons.slug })
    .returning({ id: hackathons.id });

  const addedCount = inserted.length;
  const skippedCount = rows.length - addedCount;

  console.log(
    `Сидирование завершено. Добавлено: ${addedCount}, пропущено (уже существовали): ${skippedCount}.`
  );
}

seed().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Неизвестная ошибка";
  console.error("Ошибка при сидировании базы данных:", message);
  process.exit(1);
});
