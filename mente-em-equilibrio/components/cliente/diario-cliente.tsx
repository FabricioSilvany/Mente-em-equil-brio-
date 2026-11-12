"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HUMORES, LIMITE_TEXTO, humorDe, type Entrada } from "@/lib/diario";
import { formatarData, formatarHora } from "@/lib/agenda";
import styles from "../area/diario.module.css";

type Msg = { tipo: "erro" | "ok"; texto: string } | null;

export function DiarioCliente({ entradas }: { entradas: Entrada[] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [humor, setHumor] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [privada, setPrivada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (humor === null) {
      setMsg({ tipo: "erro", texto: "Escolha como você está se sentindo." });
      return;
    }
    setEnviando(true);
    setMsg(null);

    const { error } = await supabase.rpc("registrar_diario", {
      p_humor: humor,
      p_texto: texto,
      p_privada: privada,
    });
    setEnviando(false);

    if (error) {
      console.error("Erro ao salvar o diário:", error);
      setMsg({
        tipo: "erro",
        texto: error.code === "P0001" ? error.message : "Não foi possível salvar agora. Tente novamente.",
      });
      return;
    }

    setHumor(null);
    setTexto("");
    setPrivada(false);
    setMsg({ tipo: "ok", texto: "Registro salvo." });
    router.refresh();
  }

  async function excluir(id: string) {
    if (!window.confirm("Excluir este registro? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("diario_entradas").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir:", error);
      setMsg({ tipo: "erro", texto: "Não foi possível excluir agora. Tente novamente." });
      return;
    }
    router.refresh();
  }

  return (
    <>
      <form className={styles.card} onSubmit={salvar}>
        <h2 className={styles.cardTitle}>Como você está hoje?</h2>
        <p className={styles.privacy}>
          Seu diário é privado. Só os profissionais que você autorizar em “Meus profissionais” podem ler, e você
          pode retirar a permissão quando quiser.
        </p>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Seu humor</legend>
          <div className={styles.moods}>
            {HUMORES.map((h) => (
              <label key={h.valor} className={`${styles.mood} ${humor === h.valor ? styles.moodOn : ""}`}>
                <input
                  type="radio"
                  name="humor"
                  value={h.valor}
                  checked={humor === h.valor}
                  onChange={() => setHumor(h.valor)}
                />
                <span className={styles.moodEmoji} aria-hidden="true">
                  {h.emoji}
                </span>
                <span>{h.rotulo}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="texto" className={styles.legend}>
            Quer escrever mais? (opcional)
          </label>
          <textarea
            id="texto"
            className={styles.textarea}
            value={texto}
            maxLength={LIMITE_TEXTO}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que aconteceu hoje, como foi o seu dia, o que você sentiu…"
          />
          <p className={styles.counter}>
            {texto.length}/{LIMITE_TEXTO}
          </p>
        </div>

        <label className={styles.check}>
          <input type="checkbox" checked={privada} onChange={(e) => setPrivada(e.target.checked)} />
          <span>Só para mim: esta entrada nunca será compartilhada com ninguém.</span>
        </label>

        {msg && (
          <p className={`${styles.msg} ${msg.tipo === "erro" ? styles.msgErr : styles.msgOk}`} role="alert">
            {msg.texto}
          </p>
        )}

        <button type="submit" className={styles.btn} disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar registro"}
        </button>
      </form>

      <section aria-labelledby="historico-diario">
        <h2 id="historico-diario" className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Seus registros
        </h2>

        {entradas.length === 0 ? (
          <p className={styles.empty}>Você ainda não fez nenhum registro.</p>
        ) : (
          <ul className={styles.list}>
            {entradas.map((en) => {
              const h = humorDe(en.humor);
              return (
                <li key={en.id} className={styles.entry}>
                  <div className={styles.entryHead}>
                    <div>
                      <p className={styles.name}>
                        <span aria-hidden="true">{h.emoji}</span> {h.rotulo}
                      </p>
                      <p className={styles.muted}>
                        {formatarData(en.criado_em)}, às {formatarHora(en.criado_em)}
                      </p>
                    </div>
                    <div className={styles.chips}>
                      {en.privada && <span className={`${styles.chip} ${styles.chipOff}`}>Só para mim</span>}
                      <button type="button" className={styles.btnDanger} onClick={() => excluir(en.id)}>
                        Excluir
                      </button>
                    </div>
                  </div>
                  {en.texto && <p className={styles.entryText}>{en.texto}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}