"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HUMORES } from "@/lib/diario";
import { INTENSIDADES, LIMITE_NOTA, LOCAIS, MAX_LOCAIS, MAX_MOTIVOS, MOTIVOS } from "@/lib/checkin";
import diario from "../area/diario.module.css";
import styles from "../area/checkin.module.css";

type Msg = { tipo: "erro" | "ok"; texto: string } | null;
type Opcao = { chave: string; rotulo: string };

function Chips({
  nome,
  opcoes,
  escolhidas,
  max,
  onChange,
}: {
  nome: string;
  opcoes: Opcao[];
  escolhidas: string[];
  max: number;
  onChange: (valor: string[]) => void;
}) {
  return (
    <div className={styles.options} role="group" aria-label={nome}>
      {opcoes.map((o) => {
        const on = escolhidas.includes(o.chave);
        const bloqueado = !on && escolhidas.length >= max;
        return (
          <button
            key={o.chave}
            type="button"
            className={`${styles.opt} ${on ? styles.optOn : ""}`}
            aria-pressed={on}
            disabled={bloqueado}
            onClick={() => onChange(on ? escolhidas.filter((k) => k !== o.chave) : [...escolhidas, o.chave])}
          >
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}

export function CheckinForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [humor, setHumor] = useState<number | null>(null);
  const [intensidade, setIntensidade] = useState<number | null>(null);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [locais, setLocais] = useState<string[]>([]);
  const [nota, setNota] = useState("");
  const [privada, setPrivada] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (humor === null) {
      setMsg({ tipo: "erro", texto: "Escolha como você está se sentindo." });
      return;
    }
    if (intensidade === null) {
      setMsg({ tipo: "erro", texto: "Escolha o quanto isso pesa hoje." });
      return;
    }

    setEnviando(true);
    setMsg(null);

    const { error } = await supabase.rpc("registrar_checkin", {
      p_humor: humor,
      p_intensidade: intensidade,
      p_motivos: motivos,
      p_locais: locais,
      p_nota: nota,
      p_privada: privada,
    });
    setEnviando(false);

    if (error) {
      console.error("Erro ao salvar o check-in:", error);
      setMsg({
        tipo: "erro",
        texto: error.code === "P0001" ? error.message : "Não foi possível salvar agora. Tente novamente.",
      });
      return;
    }

    setHumor(null);
    setIntensidade(null);
    setMotivos([]);
    setLocais([]);
    setNota("");
    setPrivada(false);
    setMsg({ tipo: "ok", texto: "Check-in salvo. Obrigado por se cuidar. O seu resumo foi atualizado abaixo." });
    router.refresh();
  }

  return (
    <form className={diario.card} onSubmit={salvar}>
      <h2 className={diario.cardTitle}>Check-in rápido</h2>
      <p className={diario.privacy}>
        São poucas perguntas, e você só compartilha com quem autorizar. Se estiver passando por um momento muito
        difícil, ligue 188 (CVV), 24 horas, gratuito.
      </p>

      <fieldset className={diario.fieldset}>
        <legend className={diario.legend}>1. Como você está agora?</legend>
        <div className={diario.moods}>
          {HUMORES.map((h) => (
            <label key={h.valor} className={`${diario.mood} ${humor === h.valor ? diario.moodOn : ""}`}>
              <input
                type="radio"
                name="humor"
                value={h.valor}
                checked={humor === h.valor}
                onChange={() => setHumor(h.valor)}
              />
              <span className={diario.moodEmoji} aria-hidden="true">
                {h.emoji}
              </span>
              <span>{h.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={diario.fieldset}>
        <legend className={diario.legend}>2. O quanto isso pesa hoje?</legend>
        <div className={diario.moods}>
          {INTENSIDADES.map((i) => (
            <label key={i.valor} className={`${diario.mood} ${intensidade === i.valor ? diario.moodOn : ""}`}>
              <input
                type="radio"
                name="intensidade"
                value={i.valor}
                checked={intensidade === i.valor}
                onChange={() => setIntensidade(i.valor)}
              />
              <span>{i.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={diario.fieldset}>
        <legend className={diario.legend}>3. O que está por trás disso? (opcional)</legend>
        <Chips nome="Motivos" opcoes={MOTIVOS} escolhidas={motivos} max={MAX_MOTIVOS} onChange={setMotivos} />
      </fieldset>

      <fieldset className={diario.fieldset}>
        <legend className={diario.legend}>4. Onde isso aconteceu ou acontece? (opcional)</legend>
        <Chips nome="Lugares" opcoes={LOCAIS} escolhidas={locais} max={MAX_LOCAIS} onChange={setLocais} />
      </fieldset>

      <div>
        <label htmlFor="nota" className={diario.legend}>
          5. Quer acrescentar algo? (opcional)
        </label>
        <textarea
          id="nota"
          className={diario.textarea}
          value={nota}
          maxLength={LIMITE_NOTA}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Uma frase já ajuda: o que aconteceu, com quem, como você reagiu…"
        />
        <p className={diario.counter}>
          {nota.length}/{LIMITE_NOTA}
        </p>
      </div>

      <label className={diario.check}>
        <input type="checkbox" checked={privada} onChange={(e) => setPrivada(e.target.checked)} />
        <span>Só para mim: este check-in nunca será compartilhado com ninguém.</span>
      </label>

      {msg && (
        <p className={`${diario.msg} ${msg.tipo === "erro" ? diario.msgErr : diario.msgOk}`} role="alert">
          {msg.texto}
        </p>
      )}

      <button type="submit" className={diario.btn} disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar check-in"}
      </button>
    </form>
  );
}