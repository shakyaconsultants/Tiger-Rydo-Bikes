import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { DealerSession } from "./types";

const COOKIE_NAME = "dealer_session";
const secret = new TextEncoder().encode(
  process.env.DEALER_JWT_SECRET || "tiger-rydo-dealer-secret-change-in-production"
);

export async function createDealerToken(dealer: DealerSession): Promise<string> {
  return new SignJWT({ ...dealer })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyDealerToken(token: string): Promise<DealerSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as DealerSession;
    return { ...session, role: session.role ?? "dealer" };
  } catch {
    return null;
  }
}

export async function getDealerSession(): Promise<DealerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyDealerToken(token);
}

export { COOKIE_NAME };
