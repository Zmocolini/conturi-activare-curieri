import { cookies } from "next/headers";
import { UserAccount } from "./types";

export const RECRUITERS: UserAccount[] = [
  {
    username: "glovowolt",
    password: "recrutare123",
    displayName: "Husein (GlovoWolt)",
    role: "recruiter",
  },
  {
    username: "ionutvarga",
    password: "recrutare123",
    displayName: "Ionuț Varga",
    role: "recruiter",
  },
  {
    username: "admin",
    password: "recrutare123",
    displayName: "Manager Coordonator (Acces General)",
    role: "admin",
  },
  {
    username: "manager",
    password: "recrutare123",
    displayName: "Manager Coordonator (Acces General)",
    role: "admin",
  },
];

export const AUTH_COOKIE_NAME = "recruiter_session";

export function createToken(username: string): string {
  const payload = JSON.stringify({
    username,
    createdAt: Date.now(),
  });
  return Buffer.from(payload).toString("base64url");
}

export function verifyToken(token: string): { username: string } | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    const validUser = RECRUITERS.find((u) => u.username === parsed.username);
    if (!validUser) return null;
    return { username: validUser.username };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const verified = verifyToken(token);
  if (!verified) return null;

  const user = RECRUITERS.find((u) => u.username === verified.username);
  return user || null;
}
