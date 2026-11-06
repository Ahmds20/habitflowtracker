"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not log out. Try again.");
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={logout}
      disabled={pending}
    >
      <LogOutIcon aria-hidden />
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}
