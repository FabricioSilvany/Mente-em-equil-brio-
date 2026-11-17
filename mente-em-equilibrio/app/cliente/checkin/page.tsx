import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { ResumoCheckins } from "@/components/area/resumo-checkins";
import { CheckinForm } from "@/components/cliente/checkin-form";
import { CheckinHistorico } from "@/components/cliente/checkin-historico";
import type { Checkin } from "@/lib/checkin";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import diario from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Check-in · Mente em Equilíbrio",
};

async function Content() {
  const { name, email } = await requireRole("cliente");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const agora = Date.now();
  const desde = new Date(agora - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("checkins")
    .select("id, criado_em, humor, intensidade, motivos, locais, nota, privada")
    .gte("criado_em", desde)
    .order("criado_em", { ascending: false })
    .limit(300);
  if (error) console.error("Erro ao buscar check-ins:", error);

  const lista = (error ? [] : (data ?? [])) as Checkin[];

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/cliente" className={consultas.back}>
          ← Voltar ao início
        </Link>
        <div>
          <h1 className={areaStyles.title}>Como você está?</h1>
          <p className={areaStyles.lead}>
            Responda em um minuto. Com o tempo, você enxerga o que mais pesa no seu dia a dia.
          </p>
        </div>

        {error && (
          <p className={`${diario.msg} ${diario.msgErr}`} role="alert">
            Não foi possível carregar seus check-ins agora. Tente novamente em instantes.
          </p>
        )}

        <CheckinForm />
        <ResumoCheckins checkins={lista} agora={agora} />
        <CheckinHistorico checkins={lista.slice(0, 10)} />
      </main>
    </>
  );
}

export default function CheckinPage() {
  return (
    <div className={areaStyles.page} data-role="cliente">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}