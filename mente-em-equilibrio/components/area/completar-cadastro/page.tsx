import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, cadastroIncompleto, type Role } from "@/lib/auth/roles";
import { formatarCnpj } from "@/lib/documentos";
import { CompletarCadastro } from "@/components/area/completar-cadastro";
import styles from "@/components/area/area.module.css";

export const metadata: Metadata = {
  title: "Completar cadastro · Mente em Equilíbrio",
};

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/");

  const { data: p } = await supabase
    .from("profiles")
    .select(
      "role, full_name, status_verificacao, motivo_recusa, cnpj, instituicao_nome, conselho, registro_uf, registro_profissional, data_nascimento",
    )
    .eq("id", claims.sub)
    .maybeSingle();
  if (!p) redirect("/");

  const papel = p.role as Role;
  const recusado = papel === "profissional" && p.status_verificacao === "recusado";

  // quem já está completo só volta aqui para corrigir um cadastro recusado
  if (!cadastroIncompleto(p) && !recusado) redirect(ROUTES[papel]);

  return (
    <div className={styles.page} data-role={papel}>
      <CompletarCadastro
        papel={papel}
        nome={p.full_name ?? ""}
        motivoRecusa={recusado ? (p.motivo_recusa as string | null) : null}
        inicial={{
          cnpj: p.cnpj ? formatarCnpj(p.cnpj) : "",
          instituicao: p.instituicao_nome ?? "",
          conselho: p.conselho ?? "CRP",
          uf: p.registro_uf ?? "",
          registro: p.registro_profissional ?? "",
          nascimento: p.data_nascimento ?? "",
        }}
      />
    </div>
  );
}

export default function CompletarCadastroPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <p className={styles.loading}>Carregando…</p>
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}