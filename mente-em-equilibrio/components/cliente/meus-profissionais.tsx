"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dataCurta, type Leitura, type ProfissionalVinculado } from "@/lib/diario";
import { formatarData, formatarHora } from "@/lib/agenda";
import styles from "../area/diario.module.css";

type Msg = { tipo: "erro" | "ok"; texto: string } | null;
type Props = { profissionais: ProfissionalVinculado[]; leituras: Leitura[] };

export function MeusProfissionais({ profissionais, leituras }: Props) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [codigo, setCodigo] = useState("");
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [incluir, setIncluir] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  function mostrarErro(error: { code?: string; message: string }) {
    console.error(error);
    setMsg({
      tipo: "erro",
      texto: error.code === "P0001" ? error.message : "Não foi possível concluir agora. Tente novamente.",
    });
  }

  async function vincular(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setOcupado("codigo");
    setMsg(null);

    const { data, error } = await supabase.rpc("aceitar_convite", { p_codigo: codigo });
    setOcupado(null);
    if (error) return mostrarErro(error);

    setCodigo("");
    setMsg({ tipo: "ok", texto: `Pronto! Você agora está vinculado(a) a ${data}.` });
    router.refresh();
  }

  async function alterar(id: string, ativo: boolean, anteriores = false) {
    setOcupado(id);
    setMsg(null);

    const { error } = await supabase.rpc("definir_compartilhamento", {
      p_profissional: id,
      p_ativo: ativo,
      p_incluir_anteriores: anteriores,
    });
    setOcupado(null);
    if (error) return mostrarErro(error);

    setAbrindo(null);
    setMsg({
      tipo: "ok",
      texto: ativo ? "Compartilhamento ativado." : "Você parou de compartilhar o diário.",
    });
    router.refresh();
  }

  return (
    <>
      {msg && (
        <p className={`${styles.msg} ${msg.tipo === "erro" ? styles.msgErr : styles.msgOk}`} role="alert">
          {msg.texto}
        </p>
      )}

      <section aria-labelledby="lista-prof">
        <h2 id="lista-prof" className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Quem acompanha você
        </h2>

        {profissionais.length === 0 ? (
          <p className={styles.empty}>
            Você ainda não tem profissionais vinculados. O vínculo é criado quando você agenda uma consulta, ou
            quando você usa um código de convite.
          </p>
        ) : (
          <ul className={styles.list}>
            {profissionais.map((p) => {
              const id = p.profissional_id;
              return (
                <li key={id} className={styles.entry}>
                  <div className={styles.entryHead}>
                    <div>
                      <p className={styles.name}>{p.nome}</p>
                      <p className={styles.muted}>Vinculado desde {dataCurta(p.desde)}</p>
                    </div>
                    <span className={`${styles.chip} ${p.diario_compartilhado ? styles.chipOn : styles.chipOff}`}>
                      {p.diario_compartilhado ? "Diário compartilhado" : "Diário não compartilhado"}
                    </span>
                  </div>

                  {p.diario_compartilhado ? (
                    <>
                      <p className={styles.muted}>
                        {p.nome} pode ler as suas entradas{" "}
                        {p.incluir_anteriores
                          ? "(inclusive as anteriores ao compartilhamento)"
                          : "feitas a partir do compartilhamento"}
                        , exceto as marcadas como “Só para mim”.
                      </p>
                      <button
                        type="button"
                        className={styles.btnGhost}
                        disabled={ocupado === id}
                        onClick={() => alterar(id, false)}
                      >
                        {ocupado === id ? "Aguarde…" : "Parar de compartilhar"}
                      </button>
                    </>
                  ) : abrindo === id ? (
                    <div className={styles.consent}>
                      <p>
                        <strong>{p.nome}</strong> poderá ler as entradas do seu diário (humor e texto), exceto as
                        que você marcar como “Só para mim”. Você pode parar de compartilhar quando quiser, e
                        verá aqui quem leu e quando.
                      </p>
                      <label className={styles.check}>
                        <input
                          type="radio"
                          name={`incluir-${id}`}
                          checked={!incluir}
                          onChange={() => setIncluir(false)}
                        />
                        <span>Somente as entradas a partir de agora</span>
                      </label>
                      <label className={styles.check}>
                        <input
                          type="radio"
                          name={`incluir-${id}`}
                          checked={incluir}
                          onChange={() => setIncluir(true)}
                        />
                        <span>Incluir também as entradas que já escrevi</span>
                      </label>
                      <div className={styles.inline}>
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={ocupado === id}
                          onClick={() => alterar(id, true, incluir)}
                        >
                          {ocupado === id ? "Aguarde…" : "Confirmar compartilhamento"}
                        </button>
                        <button type="button" className={styles.btnGhost} onClick={() => setAbrindo(null)}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => {
                        setAbrindo(id);
                        setIncluir(false);
                        setMsg(null);
                      }}
                    >
                      Compartilhar meu diário
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form className={styles.card} onSubmit={vincular}>
        <h2 className={styles.cardTitle}>Tenho um código de convite</h2>
        <p className={styles.muted}>
          Se o seu profissional te passou um código, digite aqui para criar o vínculo.
        </p>
        <div className={styles.inline}>
          <input
            className={styles.input}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={20}
            placeholder="CÓDIGO"
            aria-label="Código de convite"
            autoComplete="off"
          />
          <button type="submit" className={styles.btn} disabled={ocupado === "codigo" || !codigo.trim()}>
            {ocupado === "codigo" ? "Verificando…" : "Vincular"}
          </button>
        </div>
      </form>

      <section aria-labelledby="quem-leu">
        <h2 id="quem-leu" className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Quem leu o seu diário
        </h2>
        {leituras.length === 0 ? (
          <p className={styles.empty}>Ninguém leu o seu diário até agora.</p>
        ) : (
          <ul className={styles.list}>
            {leituras.map((l, i) => (
              <li key={`${l.lido_em}-${i}`} className={styles.entry}>
                <p className={styles.name}>{l.nome}</p>
                <p className={styles.muted}>
                  {formatarData(l.lido_em)}, às {formatarHora(l.lido_em)} · {l.qtd}{" "}
                  {l.qtd === 1 ? "entrada disponível" : "entradas disponíveis"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}