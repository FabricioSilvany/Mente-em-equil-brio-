"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

export function LogoutButton({ label = "Logout", className, variant }: Props) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Button onClick={logout} className={className} variant={variant}>
      {label}
    </Button>
  );
}