import { Suspense } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { LogoutButton } from "@/components/logout-button";

async function Content() {
  const { name, email, verificado } = await requireRole("profissional");
  return (
    <div className="flex flex-col gap-4 items-start">
      <h1 className="text-2xl font-bold">Olá, {name ?? email}!</h1>
      {verificado ? (
        <p className="text-muted-foreground">Esta é a área do profissional.</p>
      ) : (
        <p className="rounded-md bg-accent p-3 text-sm">
          Seu cadastro está em análise. Assim que o registro profissional for
          validado, o acesso completo será liberado.
        </p>
      )}
      <LogoutButton />
    </div>
  );
}

export default function ProfissionalPage() {
  return (
    <main className="min-h-svh p-6 md:p-10">
      <Suspense fallback={<p>Carregando…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}