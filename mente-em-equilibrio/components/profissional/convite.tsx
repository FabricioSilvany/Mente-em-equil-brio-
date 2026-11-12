"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../area/diario.module.css";

export function Convite() {
  const [supabase] = useState(() => createClient());
  const [codigo, setCodigo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setOcupado(true);
    setErro(null);
    const { data, error } = await supabase.rpc("criar_convite");
    setOcupado(false);

    if (error) {
      console.error("Erro ao criar convite:", error);
      setErro(error.code === "P0001" ? error.message : "Não foi possível gerar o código agora.");
      return;
    }
    setCodigo(data as string);
  }

  return (
    <section className={styles.card} aria-labelledby="convite-titulo">
      <h2 id="convite-titulo" className={styles.cardTitle}>
        Convidar um paciente
      </h2>
      <p className={styles.muted}>
        Gere um código e passe ao paciente. Ele digita em “Meus profissionais” e o vínculo é criado. O código vale
        por 7 dias e só pode ser usado uma vez.
      </p>

      {codigo && (
        <>
          <p className={styles.code} aria-live="polite">
            {codigo}
          </p>
          <p className={styles.muted}>Passe este código só para o paciente que você quer vincular.</p>
        </>
      )}

      {erro && (
        <p className={`${styles.msg} ${styles.msgErr}`} role="alert">
          {erro}
        </p>
      )}

      <button type="button" className={styles.btn} onClick={gerar} disabled={ocupado}>
        {ocupado ? "Gerando…" : codigo ? "Gerar outro código" : "Gerar código de convite"}
      </button>
    </section>
  );
}