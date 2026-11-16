import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Регистрация — Платформа хакатонов",
  description: "Создайте аккаунт на платформе хакатонов.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
