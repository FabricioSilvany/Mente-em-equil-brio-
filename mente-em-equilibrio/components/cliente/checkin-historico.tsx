"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { humorDe } from "@/lib/diario";
import { formatarData, formatarHora } from "@/lib/agenda";
import { LOCAIS, MOTIVOS, rotuloDe, rotuloIntensidade, type Checkin } from "@/lib/checkin";
import diario from "../area/diario.module.css";
import styles from "../area/checkin.module.css";

export function CheckinHistorico({ checkins }: { checkins: Checkin[] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [erro, setErro] = useState<string | null>(null);

  async function excluir(id: string) {
    if (!window.confirm("Excluir este check-in? Essa ação não pode ser desfeita.")) return;
    setErro(null);
    const { error } = await supabase.from("checkins").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir:", error);
      setErro("Não foi possível excluir agora. Tente novamente.");
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="hist-checkin">
      <h2 id="hist-checkin" className={diario.cardTitle} style={{ marginBottom: 12 }}>
        Seus últimos check-ins
      </h2>

      {erro && (
        <p className={`${diario.msg} ${diario.msgErr}`} role="alert">
          {erro}
        </p>
      )}

      {checkins.length === 0 ? (
        <p className={diario.empty}>Você ainda não fez nenhum check-in.</p>
      ) : (
        <ul className={diario.list}>
          {checkins.map((c) => {
            const h = humorDe(c.humor);
            return (
              <li key={c.id} className={diario.entry}>
                <div className={diario.entryHead}>
                  <div>
                    <p className={diario.name}>
                      <span aria-hidden="true">{h.emoji}</span> {h.rotulo} · pesa{" "}
                      {rotuloIntensidade(c.intensidade).toLowerCase()}
                    </p>
                    <p className={diario.muted}>
                      {formatarData(c.criado_em)}, às {formatarHora(c.criado_em)}
                    </p>
                  </div>
                  <div className={diario.chips}>
                    {c.privada && <span className={`${diario.chip} ${diario.chipOff}`}>Só para mim</span>}
                    <button type="button" className={diario.btnDanger} onClick={() => excluir(c.id)}>
                      Excluir
                    </button>
                  </div>
                </div>

                {(c.motivos.length > 0 || c.locais.length > 0) && (
                  <div className={styles.tags}>
                    {c.motivos.map((k) => (
                      <span key={`m-${k}`} className={styles.tag}>
                        {rotuloDe(MOTIVOS, k)}
                      </span>
                    ))}
                    {c.locais.map((k) => (
                      <span key={`l-${k}`} className={`${styles.tag} ${styles.tagAlt}`}>
                        {rotuloDe(LOCAIS, k)}
                      </span>
                    ))}
                  </div>
                )}

                {c.nota && <p className={diario.entryText}>{c.nota}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}