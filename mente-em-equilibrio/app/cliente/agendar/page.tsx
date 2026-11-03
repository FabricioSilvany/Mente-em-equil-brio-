import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { AgendarConsulta } from "@/components/cliente/agendar-consulta";
import areaStyles from "@/components/area/area.module.css";
import styles from "@/components/cliente/agendar.module.css";

export const metadata: Metadata = {
  title: "Agendar consulta · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("cliente");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("listar_profissionais");
  if (error) console.error("Erro ao listar profissionais:", error);
  const profissionais = (error ? [] : (data ?? [])) as { id: string; nome: string }[];

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={styles.wrap}>
        <Link href="/cliente" className={styles.back}>
          ← Voltar ao início
        </Link>
        <div>
          <h1 className={areaStyles.title}>Agendar consulta</h1>
          <p className={areaStyles.lead}>Escolha o profissional, o dia e o horário.</p>
        </div>
        {error && (
          <p className={`${styles.msg} ${styles.msgError}`} role="alert">
            Não foi possível carregar os profissionais agora. Tente novamente em instantes.
          </p>
        )}
        <AgendarConsulta profissionais={profissionais} />
      </main>
    </>
  );
}

export default function AgendarPage() {
  return (
    <div className={areaStyles.page} data-role="cliente">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}