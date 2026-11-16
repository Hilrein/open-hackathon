import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSession() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return session ?? null;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
