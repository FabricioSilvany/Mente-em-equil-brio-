import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { humorDe, type Entrada, type PacienteVinculado } from "@/lib/diario";
import { formatarData, formatarHora } from "@/lib/agenda";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import styles from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Diário do paciente · Mente em Equilíbrio",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, email } = await requireRole("profissional");
  const displayName = name?.trim() || email || "";

  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: lista } = await supabase.rpc("meus_pacientes");
  const paciente = ((lista ?? []) as PacienteVinculado[]).find((p) => p.paciente_id === id);
  if (!paciente) notFound();

  let entradas: Entrada[] = [];
  let aviso: string | null = null;

  if (!paciente.diario_compartilhado) {
    aviso = "Este paciente não compartilhou o diário com você.";
  } else {
    const { data, error } = await supabase.rpc("diario_do_paciente", { p_paciente: id });
    if (error) {
      console.error("Erro ao ler o diário:", error);
      aviso = error.code === "P0001" ? error.message : "Não foi possível carregar o diário agora.";
    } else {
      entradas = (data ?? []) as Entrada[];
    }
  }

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/profissional/pacientes" className={consultas.back}>
          ← Voltar aos pacientes
        </Link>
        <div>
          <h1 className={areaStyles.title}>Diário de {paciente.nome}</h1>
          <p className={areaStyles.lead}>
            Somente leitura. Você vê apenas o que o paciente escolheu compartilhar, e cada leitura fica registrada.
          </p>
        </div>

        {aviso && (
          <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
            {aviso}
          </p>
        )}

        {!aviso && entradas.length === 0 && (
          <p className={styles.empty}>Não há entradas compartilhadas até o momento.</p>
        )}

        {entradas.length > 0 && (
          <ul className={styles.list}>
            {entradas.map((en) => {
              const h = humorDe(en.humor);
              return (
                <li key={en.id} className={styles.entry}>
                  <div>
                    <p className={styles.name}>
                      <span aria-hidden="true">{h.emoji}</span> {h.rotulo}
                    </p>
                    <p className={styles.muted}>
                      {formatarData(en.criado_em)}, às {formatarHora(en.criado_em)}
                    </p>
                  </div>
                  {en.texto && <p className={styles.entryText}>{en.texto}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

export default function DiarioPacientePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className={areaStyles.page} data-role="profissional">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}