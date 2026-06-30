import { getDealerSession } from "@/lib/auth";
import type { DealerSession, PortalRole } from "@/lib/types";

export async function requireSession(
  roles?: PortalRole[]
): Promise<DealerSession | null> {
  const session = await getDealerSession();
  if (!session) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session;
}
