import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { MeusProfissionais } from "@/components/cliente/meus-profissionais";
import type { Leitura, ProfissionalVinculado } from "@/lib/diario";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import styles from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Meus profissionais · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("cliente");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const [prof, leit] = await Promise.all([
    supabase.rpc("meus_profissionais"),
    supabase.rpc("quem_leu_meu_diario"),
  ]);
  if (prof.error) console.error("Erro ao buscar profissionais:", prof.error);
  if (leit.error) console.error("Erro ao buscar leituras:", leit.error);

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/cliente" className={consultas.back}>
          ← Voltar ao início
        </Link>
        <div>
          <h1 className={areaStyles.title}>Meus profissionais</h1>
          <p className={areaStyles.lead}>
            Veja quem acompanha você e escolha o que compartilhar. Você decide, e pode mudar quando quiser.
          </p>
        </div>

        {(prof.error || leit.error) && (
          <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
            Não foi possível carregar tudo agora. Tente novamente em instantes.
          </p>
        )}

        <MeusProfissionais
          profissionais={(prof.error ? [] : (prof.data ?? [])) as ProfissionalVinculado[]}
          leituras={(leit.error ? [] : (leit.data ?? [])) as Leitura[]}
        />
      </main>
    </>
  );
}

export default function ProfissionaisPage() {
  return (
    <div className={areaStyles.page} data-role="cliente">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}