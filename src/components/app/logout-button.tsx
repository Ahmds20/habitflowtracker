"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { apiFetch } from "@/lib/api-client";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error(t.nav.logoutFailed);
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
      {pending ? t.nav.loggingOut : t.nav.logout}
    </Button>
  );
}
