import "dotenv/config";
import { count } from "drizzle-orm";
import { getDb } from "./index";
import { hackathons } from "./schema";

async function ping() {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "") {
    console.error(
      "DATABASE_URL не задан. Скопируйте .env.example в .env и укажите строку подключения Neon."
    );
    process.exit(1);
  }

  const db = getDb();
  const [result] = await db.select({ value: count() }).from(hackathons);
  const total = result?.value ?? 0;

  console.log(`Подключение к базе работает. Хакатонов в базе: ${total}`);
}

ping().catch(() => {
  console.error(
    "Не удалось подключиться к базе данных или выполнить запрос. Проверьте DATABASE_URL и применённые миграции."
  );
  process.exit(1);
});
