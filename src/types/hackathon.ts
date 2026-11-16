export type HackathonStatus = "upcoming" | "active" | "finished";
export type HackathonFormat = "online" | "offline" | "hybrid";

export interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO-строка, например "2026-12-01T10:00:00Z"
  endDate: string; // ISO-строка
  location: string; // "Онлайн" или название города/площадки
  format: HackathonFormat;
  status: HackathonStatus;
  participantsCount: number;
  maxParticipants?: number;
  tags: string[];
  prizePool?: string; // например "500 000 ₽" или "$10,000"
  imageUrl?: string;
  organizerName: string;
}
