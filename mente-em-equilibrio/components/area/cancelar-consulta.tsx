"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./consultas.module.css";

type Props = {
  consultaId: string;
  quem: "paciente" | "profissional";
  permitido?: boolean;
  aviso?: string;
};

export function CancelarConsulta({ consultaId, quem, permitido = true, aviso }: Props) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function cancelar() {
    setEnviando(true);
    setErro(null);

    const { error } = await supabase.rpc("cancelar_consulta", { p_consulta: consultaId });

    if (error) {
      console.error("Erro ao cancelar:", error);
      // P0001 = mensagens que escrevi no banco (já estão em português e são seguras de mostrar)
      setErro(error.code === "P0001" ? error.message : "Não foi possível cancelar agora. Tente novamente.");
    }

    setEnviando(false);
    setConfirmando(false);
    router.refresh();
  }

  if (!permitido) {
    return aviso ? <p className={styles.cancelNote}>{aviso}</p> : null;
  }

  return (
    <div className={styles.actions}>
      {erro && (
        <p className={styles.cancelErr} role="alert">
          {erro}
        </p>
      )}

      {!confirmando ? (
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => {
            setErro(null);
            setConfirmando(true);
          }}
        >
          {quem === "paciente" ? "Cancelar consulta" : "Cancelar atendimento"}
        </button>
      ) : (
        <div className={styles.confirmBox} role="group" aria-label="Confirmar cancelamento">
          <p>
            {quem === "paciente"
              ? "Cancelar esta consulta? O horário voltará a ficar disponível para outras pessoas."
              : "Cancelar este atendimento? O paciente verá a consulta como cancelada por você."}
          </p>
          <div className={styles.confirmRow}>
            <button type="button" className={styles.confirmYes} onClick={cancelar} disabled={enviando}>
              {enviando ? "Cancelando…" : "Sim, cancelar"}
            </button>
            <button type="button" className={styles.confirmNo} onClick={() => setConfirmando(false)} disabled={enviando}>
              Manter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}