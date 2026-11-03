import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { ListaConsultas } from "@/components/cliente/lista-consultas";
import type { Consulta } from "@/lib/agenda";
import areaStyles from "@/components/area/area.module.css";
import styles from "@/components/area/consultas.module.css";

export const metadata: Metadata = {
  title: "Minhas consultas · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("cliente");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("minhas_consultas");
  if (error) console.error("Erro ao buscar consultas:", error);

  const todas = (error ? [] : (data ?? [])) as Consulta[];
  const agora = Date.now();
  const fim = (c: Consulta) => new Date(c.inicio).getTime() + c.duracao_min * 60_000;

  // a função do banco já devolve em ordem de data (da mais próxima para a mais distante)
  const proximas = todas.filter((c) => c.status === "agendada" && fim(c) > agora);
  const historico = todas.filter((c) => !proximas.includes(c)).reverse(); // mais recentes primeiro

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/cliente" className={styles.back}>
          ← Voltar ao início
        </Link>

        <div className={styles.head}>
          <div>
            <h1 className={areaStyles.title}>Minhas consultas</h1>
            <p className={areaStyles.lead}>Acompanhe aqui tudo o que você já marcou.</p>
          </div>
          <Link href="/cliente/agendar" className={styles.cta}>
            Agendar consulta
          </Link>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            Não foi possível carregar suas consultas agora. Tente novamente em instantes.
          </p>
        )}

        <ListaConsultas proximas={proximas} historico={historico} />
      </main>
    </>
  );
}

export default function ConsultasPage() {
  return (
    <div className={areaStyles.page} data-role="cliente">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}