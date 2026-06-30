"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CONTENT_SYNC_CHANNEL } from "@/lib/content-sync";

const POLL_MS = 4000;

function isPortalRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/dealer");
}

export default function PublicAutoRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const versionRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPortalRoute(pathname)) return;

    let cancelled = false;

    async function checkVersion() {
      try {
        const res = await fetch("/api/content-version", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { version } = await res.json();
        if (versionRef.current !== null && versionRef.current !== version) {
          router.refresh();
        }
        versionRef.current = version;
      } catch {
        // ignore network errors
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, POLL_MS);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(CONTENT_SYNC_CHANNEL);
      channel.onmessage = () => {
        if (!cancelled) {
          checkVersion().then(() => router.refresh());
        }
      };
    } catch {
      // polling only
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      channel?.close();
    };
  }, [pathname, router]);

  return null;
}
