import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { DiarioCliente } from "@/components/cliente/diario-cliente";
import type { Entrada } from "@/lib/diario";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import styles from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Diário de bem-estar · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("cliente");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diario_entradas")
    .select("id, criado_em, humor, texto, privada")
    .order("criado_em", { ascending: false })
    .limit(100);
  if (error) console.error("Erro ao buscar o diário:", error);

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/cliente" className={consultas.back}>
          ← Voltar ao início
        </Link>
        <div>
          <h1 className={areaStyles.title}>Diário de bem-estar</h1>
          <p className={areaStyles.lead}>Registre como você se sente, no seu ritmo.</p>
        </div>

        {error && (
          <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
            Não foi possível carregar seus registros agora. Tente novamente em instantes.
          </p>
        )}

        <DiarioCliente entradas={(data ?? []) as Entrada[]} />
      </main>
    </>
  );
}

export default function DiarioPage() {
  return (
    <div className={areaStyles.page} data-role="cliente">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}