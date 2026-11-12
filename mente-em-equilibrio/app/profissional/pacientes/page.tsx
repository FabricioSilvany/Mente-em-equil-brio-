import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { Convite } from "@/components/profissional/convite";
import { dataCurta, type PacienteVinculado } from "@/lib/diario";
import { formatarDataHora } from "@/lib/agenda";
import areaStyles from "@/components/area/area.module.css";
import consultas from "@/components/area/consultas.module.css";
import styles from "@/components/area/diario.module.css";

export const metadata: Metadata = {
  title: "Meus pacientes · Mente em Equilíbrio",
};

async function Content() {
  const { name, email, verificado } = await requireRole("profissional");
  const displayName = name?.trim() || email || "";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("meus_pacientes");
  if (error) console.error("Erro ao buscar pacientes:", error);
  const pacientes = (error ? [] : (data ?? [])) as PacienteVinculado[];

  return (
    <>
      <AreaHeader displayName={displayName} />
      <main className={areaStyles.container}>
        <Link href="/profissional" className={consultas.back}>
          ← Voltar ao início
        </Link>
        <div>
          <h1 className={areaStyles.title}>Meus pacientes</h1>
          <p className={areaStyles.lead}>
            Pacientes vinculados a você, por agendamento ou por convite.
          </p>
        </div>

        {error && (
          <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
            Não foi possível carregar seus pacientes agora. Tente novamente em instantes.
          </p>
        )}

        {verificado ? (
          <Convite />
        ) : (
          <p className={areaStyles.notice}>
            Os convites ficam disponíveis depois que o seu registro profissional for validado.
          </p>
        )}

        <section aria-labelledby="lista-pacientes">
          <h2 id="lista-pacientes" className={styles.cardTitle} style={{ marginBottom: 12 }}>
            Pacientes
          </h2>

          {pacientes.length === 0 ? (
            <p className={styles.empty}>
              Você ainda não tem pacientes vinculados. Eles aparecem aqui quando agendam com você ou usam o seu
              código de convite.
            </p>
          ) : (
            <ul className={styles.list}>
              {pacientes.map((p) => (
                <li key={p.paciente_id} className={styles.entry}>
                  <div className={styles.entryHead}>
                    <div>
                      <p className={styles.name}>{p.nome}</p>
                      <p className={styles.muted}>
                        Paciente desde {dataCurta(p.desde)} ·{" "}
                        {p.proxima_consulta
                          ? `próxima consulta: ${formatarDataHora(p.proxima_consulta)}`
                          : "sem consulta marcada"}
                      </p>
                    </div>
                    <span className={`${styles.chip} ${p.diario_compartilhado ? styles.chipOn : styles.chipOff}`}>
                      {p.diario_compartilhado ? "Diário compartilhado" : "Diário não compartilhado"}
                    </span>
                  </div>

                  {p.diario_compartilhado ? (
                    <Link href={`/profissional/pacientes/${p.paciente_id}`} className={styles.link}>
                      Ler diário →
                    </Link>
                  ) : (
                    <p className={styles.muted}>O paciente ainda não compartilhou o diário com você.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

export default function PacientesPage() {
  return (
    <div className={areaStyles.page} data-role="profissional">
      <Suspense fallback={<p className={areaStyles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}