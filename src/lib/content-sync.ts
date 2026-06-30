"use client";

export const CONTENT_SYNC_CHANNEL = "tiger-rydo-content-updated";

/** Tell other open tabs (e.g. main website) to refresh immediately. */
export function notifyContentUpdated() {
  if (typeof window === "undefined") return;
  try {
    const channel = new BroadcastChannel(CONTENT_SYNC_CHANNEL);
    channel.postMessage({ at: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel not supported — polling on public pages still works
  }
}
