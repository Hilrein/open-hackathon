import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { hackathons } from "@/db/schema";

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const MAX_SLUG_LENGTH = 60;
const MAX_SEQUENTIAL_ATTEMPTS = 20;

export function slugifyTitle(title: string): string {
  const transliterated = title
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");

  const normalized = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return normalized || "hackathon";
}

async function slugExists(slug: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ slug: hackathons.slug })
    .from(hackathons)
    .where(eq(hackathons.slug, slug))
    .limit(1);

  return rows.length > 0;
}

export async function generateUniqueHackathonSlug(
  title: string
): Promise<string> {
  const baseSlug = slugifyTitle(title);

  if (!(await slugExists(baseSlug))) {
    return baseSlug;
  }

  for (let suffix = 2; suffix <= MAX_SEQUENTIAL_ATTEMPTS + 1; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${baseSlug.slice(0, MAX_SLUG_LENGTH - suffixText.length).replace(/-+$/g, "")}${suffixText}`;
    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomSuffix = `-${crypto.randomBytes(3).toString("hex")}`;
    const candidate = `${baseSlug.slice(0, MAX_SLUG_LENGTH - randomSuffix.length).replace(/-+$/g, "")}${randomSuffix}`;
    if (!(await slugExists(candidate))) {
      return candidate;
    }
  }

  return `${baseSlug.slice(0, 48).replace(/-+$/g, "")}-${Date.now()}`;
}
