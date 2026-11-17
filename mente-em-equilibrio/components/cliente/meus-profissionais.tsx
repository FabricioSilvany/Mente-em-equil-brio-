"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dataCurta, type Leitura, type ProfissionalVinculado } from "@/lib/diario";
import { formatarData, formatarHora } from "@/lib/agenda";
import styles from "../area/diario.module.css";
import check from "../area/checkin.module.css";

type Msg = { tipo: "erro" | "ok"; texto: string } | null;
type Tipo = "diario" | "checkin";
type Props = { profissionais: ProfissionalVinculado[]; leituras: Leitura[] };

const TEXTOS: Record<Tipo, { titulo: string; oque: string; rpc: string }> = {
  diario: {
    titulo: "Diário",
    oque: "as entradas do seu diário (humor e texto)",
    rpc: "definir_compartilhamento",
  },
  checkin: {
    titulo: "Check-ins",
    oque: "os seus check-ins (humor, motivos, lugares e observação)",
    rpc: "definir_compartilhamento_checkins",
  },
};

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

  async function alterar(tipo: Tipo, id: string, ativo: boolean, anteriores = false) {
    setOcupado(`${id}:${tipo}`);
    setMsg(null);

    const { error } = await supabase.rpc(TEXTOS[tipo].rpc, {
      p_profissional: id,
      p_ativo: ativo,
      p_incluir_anteriores: anteriores,
    });
    setOcupado(null);
    if (error) return mostrarErro(error);

    setAbrindo(null);
    setMsg({
      tipo: "ok",
      texto: ativo
        ? `Compartilhamento de ${TEXTOS[tipo].titulo.toLowerCase()} ativado.`
        : `Você parou de compartilhar ${TEXTOS[tipo].titulo.toLowerCase()}.`,
    });
    router.refresh();
  }

  function bloco(p: ProfissionalVinculado, tipo: Tipo) {
    const id = p.profissional_id;
    const chave = `${id}:${tipo}`;
    const ativo = tipo === "diario" ? p.diario_compartilhado : p.checkins_compartilhado;
    const anteriores = tipo === "diario" ? p.incluir_anteriores : p.checkins_incluir_anteriores;
    const t = TEXTOS[tipo];

    return (
      <div className={check.share} key={tipo}>
        <div className={check.shareHead}>
          <p className={check.shareTitle}>{t.titulo}</p>
          <span className={`${styles.chip} ${ativo ? styles.chipOn : styles.chipOff}`}>
            {ativo ? "Compartilhado" : "Não compartilhado"}
          </span>
        </div>

        {ativo ? (
          <>
            <p className={styles.muted}>
              {p.nome} pode ver {t.oque}{" "}
              {anteriores ? "(inclusive o que veio antes do compartilhamento)" : "feitos a partir do compartilhamento"},
              exceto o que você marcou como “Só para mim”.
            </p>
            <button
              type="button"
              className={styles.btnGhost}
              disabled={ocupado === chave}
              onClick={() => alterar(tipo, id, false)}
            >
              {ocupado === chave ? "Aguarde…" : "Parar de compartilhar"}
            </button>
          </>
        ) : abrindo === chave ? (
          <div className={styles.consent}>
            <p>
              <strong>{p.nome}</strong> poderá ver {t.oque}, exceto o que você marcar como “Só para mim”. Você pode
              parar de compartilhar quando quiser, e verá aqui quem viu e quando.
            </p>
            <label className={styles.check}>
              <input
                type="radio"
                name={`incluir-${chave}`}
                checked={!incluir}
                onChange={() => setIncluir(false)}
              />
              <span>Somente o que eu registrar a partir de agora</span>
            </label>
            <label className={styles.check}>
              <input
                type="radio"
                name={`incluir-${chave}`}
                checked={incluir}
                onChange={() => setIncluir(true)}
              />
              <span>Incluir também o que eu já registrei</span>
            </label>
            <div className={styles.inline}>
              <button
                type="button"
                className={styles.btn}
                disabled={ocupado === chave}
                onClick={() => alterar(tipo, id, true, incluir)}
              >
                {ocupado === chave ? "Aguarde…" : "Confirmar compartilhamento"}
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
              setAbrindo(chave);
              setIncluir(false);
              setMsg(null);
            }}
          >
            Compartilhar {t.titulo.toLowerCase()}
          </button>
        )}
      </div>
    );
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
            {profissionais.map((p) => (
              <li key={p.profissional_id} className={styles.entry}>
                <div>
                  <p className={styles.name}>{p.nome}</p>
                  <p className={styles.muted}>Vinculado desde {dataCurta(p.desde)}</p>
                </div>
                {bloco(p, "diario")}
                {bloco(p, "checkin")}
              </li>
            ))}
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
          Quem viu os seus dados
        </h2>
        {leituras.length === 0 ? (
          <p className={styles.empty}>Ninguém viu o seu diário ou os seus check-ins até agora.</p>
        ) : (
          <ul className={styles.list}>
            {leituras.map((l, i) => (
              <li key={`${l.lido_em}-${i}`} className={styles.entry}>
                <p className={styles.name}>
                  {l.nome} · {l.tipo === "checkin" ? "viu os check-ins" : "leu o diário"}
                </p>
                <p className={styles.muted}>
                  {formatarData(l.lido_em)}, às {formatarHora(l.lido_em)} · {l.qtd}{" "}
                  {l.tipo === "checkin"
                    ? l.qtd === 1
                      ? "check-in disponível"
                      : "check-ins disponíveis"
                    : l.qtd === 1
                      ? "entrada disponível"
                      : "entradas disponíveis"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}