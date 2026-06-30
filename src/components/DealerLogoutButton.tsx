"use client";

import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import { LogOut } from "lucide-react";

export default function DealerLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/dealer/logout", { method: "POST" });
    router.push("/dealer/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
