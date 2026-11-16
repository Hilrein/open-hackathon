import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход — Платформа хакатонов",
  description: "Войдите в аккаунт на платформе хакатонов.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
