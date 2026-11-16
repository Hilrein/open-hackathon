import type { Hackathon } from "@/types/hackathon";

export const mockHackathons: Hackathon[] = [
  {
    id: "ai-assistants-2026",
    title: "Помощники на базе ИИ для повседневных задач",
    description:
      "Создайте понятного цифрового помощника, который экономит время людям в работе, учёбе или быту.",
    startDate: "2026-12-01T10:00:00Z",
    endDate: "2026-12-03T18:00:00Z",
    location: "Онлайн",
    format: "online",
    status: "upcoming",
    participantsCount: 124,
    maxParticipants: 200,
    tags: ["AI", "Python", "Frontend", "Beginner-friendly", "48 часов"],
    prizePool: "500 000 ₽",
    organizerName: "Технопарк",
  },
  {
    id: "fintech-moscow-2026",
    title: "Удобные финансы для малого бизнеса",
    description:
      "Двухдневный очный хакатон по разработке простых сервисов учёта и платежей для предпринимателей.",
    startDate: "2026-11-12T09:00:00Z",
    endDate: "2026-11-14T20:00:00Z",
    location: "Москва",
    format: "offline",
    status: "active",
    participantsCount: 82,
    maxParticipants: 100,
    tags: ["FinTech", "Design", "Frontend", "48 часов"],
    prizePool: "750 000 ₽",
    organizerName: "ФинЛаб Москва",
  },
  {
    id: "edtech-spb-2026",
    title: "Образование будущего: сервисы для школ и вузов",
    description:
      "Командное соревнование по созданию платформ и инструментов для увлекательного обучения.",
    startDate: "2026-10-16T10:00:00Z",
    endDate: "2026-10-18T18:00:00Z",
    location: "Санкт-Петербург",
    format: "hybrid",
    status: "finished",
    participantsCount: 151,
    tags: ["EdTech", "Design", "Beginner-friendly"],
    organizerName: "Открытый Университет",
  },
  {
    id: "healthtech-kazan-2026",
    title: "Цифровая забота о здоровье",
    description:
      "Разработка мобильных и веб-решений для записи к врачу, напоминаний и поддержки пациентов.",
    startDate: "2026-12-11T10:00:00Z",
    endDate: "2026-12-13T18:00:00Z",
    location: "Казань",
    format: "offline",
    status: "upcoming",
    participantsCount: 41,
    tags: ["HealthTech", "Python", "Design"],
    prizePool: "300 000 ₽",
    organizerName: "ИТ-Парк Казань",
  },
  {
    id: "gamedev-weekend-2026",
    title: "Выходные инди-игр: первая версия за 48 часов",
    description:
      "Соберите команду и сделайте прототип небольшой игры на любую тему с нуля.",
    startDate: "2026-11-13T15:00:00Z",
    endDate: "2026-11-15T15:00:00Z",
    location: "Онлайн",
    format: "online",
    status: "active",
    participantsCount: 205,
    maxParticipants: 250,
    tags: ["GameDev", "Design", "48 часов", "Beginner-friendly"],
    organizerName: "Сообщество Инди",
  },
  {
    id: "web3-open-2026",
    title: "Открытые цифровые сервисы и проверка подлинности",
    description:
      "Практический хакатон по созданию прозрачных систем голосования, сертификатов и реестров.",
    startDate: "2026-10-23T10:00:00Z",
    endDate: "2026-10-25T18:00:00Z",
    location: "Онлайн",
    format: "online",
    status: "finished",
    participantsCount: 64,
    maxParticipants: 120,
    tags: ["Web3", "Python", "Frontend"],
    prizePool: "$10,000",
    imageUrl: "/placeholder-hackathon.svg",
    organizerName: "КриптоЛаб",
  },
];

export function getHackathonById(id: string): Hackathon | undefined {
  return mockHackathons.find((hackathon) => hackathon.id === id);
}
