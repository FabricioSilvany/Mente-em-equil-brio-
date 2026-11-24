import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { RevisaoProfissionais, type ProfissionalRevisao } from "@/components/admin/revisao-profissionais";
import area from "@/components/area/area.module.css";
import diario from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Administração · Mente em Equilíbrio",
  robots: { index: false, follow: false },
};

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/");

  const { data: admin } = await supabase.rpc("sou_admin");
  if (admin !== true) notFound();

  const { data: itens, error } = await supabase.rpc("admin_listar_profissionais", { p_status: null });
  if (error) console.error("Erro ao listar profissionais:", error);

  return (
    <main className={area.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <Link href="/" className={area.back}>
          ← Voltar ao site
        </Link>
        <LogoutButton
          label="Sair"
          variant="outline"
          className="rounded-full border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
        />
      </div>

      <div>
        <p className={area.eyebrow}>Administração</p>
        <h1 className={area.title}>Verificação de profissionais</h1>
        <p className={area.lead}>
          Aprove apenas quem tiver o registro ativo no conselho e um CNPJ de instituição válido.
        </p>
      </div>

      {error && (
        <p className={`${diario.msg} ${diario.msgErr}`} role="alert">
          Não foi possível carregar a lista agora.
        </p>
      )}

      <RevisaoProfissionais itens={(error ? [] : (itens ?? [])) as ProfissionalRevisao[]} />
    </main>
  );
}

export default function AdminPage() {
  return (
    <div className={area.page} data-role="profissional">
      <Suspense fallback={<p className={area.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}