import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { ResumoCheckins } from "@/components/area/resumo-checkins";
import { humorDe, type Entrada, type PacienteVinculado } from "@/lib/diario";
import { LOCAIS, MOTIVOS, rotuloDe, rotuloIntensidade, type Checkin } from "@/lib/checkin";
import { formatarData, formatarHora } from "@/lib/agenda";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import styles from "@/components/area/diario.module.css";
import check from "@/components/area/checkin.module.css";

export const metadata: Metadata = {
  title: "Paciente · Mente em Equilíbrio",
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

  const agora = Date.now();

  // ---- check-ins ----
  let checkins: Checkin[] = [];
  let avisoCheckins: string | null = null;
  if (!paciente.checkins_compartilhado) {
    avisoCheckins = "Este paciente não compartilhou os check-ins com você.";
  } else {
    const { data, error } = await supabase.rpc("checkins_do_paciente", { p_paciente: id });
    if (error) {
      console.error("Erro ao ler os check-ins:", error);
      avisoCheckins = error.code === "P0001" ? error.message : "Não foi possível carregar os check-ins agora.";
    } else {
      checkins = (data ?? []) as Checkin[];
    }
  }

  // ---- diário ----
  let entradas: Entrada[] = [];
  let avisoDiario: string | null = null;
  if (!paciente.diario_compartilhado) {
    avisoDiario = "Este paciente não compartilhou o diário com você.";
  } else {
    const { data, error } = await supabase.rpc("diario_do_paciente", { p_paciente: id });
    if (error) {
      console.error("Erro ao ler o diário:", error);
      avisoDiario = error.code === "P0001" ? error.message : "Não foi possível carregar o diário agora.";
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
          <h1 className={areaStyles.title}>{paciente.nome}</h1>
          <p className={areaStyles.lead}>
            Somente leitura. Você vê apenas o que o paciente escolheu compartilhar, e cada acesso fica registrado.
          </p>
        </div>

        {/* Check-ins */}
        <section aria-labelledby="sec-checkins" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 id="sec-checkins" className={styles.cardTitle}>
            Check-ins
          </h2>

          {avisoCheckins ? (
            <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
              {avisoCheckins}
            </p>
          ) : (
            <>
              <ResumoCheckins checkins={checkins} agora={agora} />

              {checkins.length > 0 && (
                <>
                  <h3 className={check.subtitulo} style={{ marginBottom: 0 }}>
                    Check-ins mais recentes
                  </h3>
                  <ul className={styles.list}>
                    {checkins.slice(0, 15).map((c) => {
                      const h = humorDe(c.humor);
                      return (
                        <li key={c.id} className={styles.entry}>
                          <div>
                            <p className={styles.name}>
                              <span aria-hidden="true">{h.emoji}</span> {h.rotulo} · pesa{" "}
                              {rotuloIntensidade(c.intensidade).toLowerCase()}
                            </p>
                            <p className={styles.muted}>
                              {formatarData(c.criado_em)}, às {formatarHora(c.criado_em)}
                            </p>
                          </div>
                          {(c.motivos.length > 0 || c.locais.length > 0) && (
                            <div className={check.tags}>
                              {c.motivos.map((k) => (
                                <span key={`m-${k}`} className={check.tag}>
                                  {rotuloDe(MOTIVOS, k)}
                                </span>
                              ))}
                              {c.locais.map((k) => (
                                <span key={`l-${k}`} className={`${check.tag} ${check.tagAlt}`}>
                                  {rotuloDe(LOCAIS, k)}
                                </span>
                              ))}
                            </div>
                          )}
                          {c.nota && <p className={styles.entryText}>{c.nota}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}
        </section>

        {/* Diário */}
        <section aria-labelledby="sec-diario" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="sec-diario" className={styles.cardTitle}>
            Diário
          </h2>

          {avisoDiario && (
            <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
              {avisoDiario}
            </p>
          )}

          {!avisoDiario && entradas.length === 0 && (
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
        </section>
      </main>
    </>
  );
}

export default function PacienteDadosPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className={areaStyles.page} data-role="profissional">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content params={params} />
      </Suspense>
    </div>
  );
}