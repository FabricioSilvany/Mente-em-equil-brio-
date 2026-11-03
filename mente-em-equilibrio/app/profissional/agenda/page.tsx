import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { AgendaProfissional } from "@/components/profissional/agenda-profissional";
import { chaveDoDia, type Consulta } from "@/lib/agenda";
import areaStyles from "@/components/area/area.module.css";
import styles from "@/components/area/consultas.module.css";

export const metadata: Metadata = {
  title: "Minha agenda · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("profissional");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("minhas_consultas");
  if (error) console.error("Erro ao buscar consultas:", error);

  const todas = (error ? [] : (data ?? [])) as Consulta[];
  const agora = Date.now();
  const fim = (c: Consulta) => new Date(c.inicio).getTime() + c.duracao_min * 60_000;
  const proximas = todas.filter((c) => c.status === "agendada" && fim(c) > agora);

  const hoje = chaveDoDia(new Date(agora));
  const amanha = chaveDoDia(new Date(agora + 24 * 60 * 60 * 1000)); // Bahia não usa horário de verão

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/profissional" className={styles.back}>
          ← Voltar ao início
        </Link>

        <div>
          <h1 className={areaStyles.title}>Minha agenda</h1>
          <p className={areaStyles.lead}>
            Veja os pacientes que marcaram consulta com você, dia a dia.
          </p>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            Não foi possível carregar a agenda agora. Tente novamente em instantes.
          </p>
        )}

        <AgendaProfissional consultas={proximas} hoje={hoje} amanha={amanha} />
      </main>
    </>
  );
}

export default function AgendaPage() {
  return (
    <div className={areaStyles.page} data-role="profissional">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}