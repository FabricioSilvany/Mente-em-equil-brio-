tsx
import { Suspense } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { LogoutButton } from "@/components/logout-button";

async function Content() {
  const { name, email } = await requireRole("cliente");
  return (
    <div className="flex flex-col gap-4 items-start">
      <h1 className="text-2xl font-bold">Olá, {name ?? email}!</h1>
      <p className="text-muted-foreground">Esta é a área do cliente.</p>
      <LogoutButton />
    </div>
  );
}

export default function ClientePage() {
  return (
    <main className="min-h-svh p-6 md:p-10">
      <Suspense fallback={<p>Carregando…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}