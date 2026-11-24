"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatarCnpj } from "@/lib/documentos";
import { dataCurta } from "@/lib/diario";
import styles from "../area/diario.module.css";

export type ProfissionalRevisao = {
  id: string;
  nome: string;
  email: string;
  conselho: string | null;
  registro: string | null;
  uf: string | null;
  cnpj: string | null;
  instituicao: string | null;
  status: string;
  motivo: string | null;
  criado_em: string;
};

const ABAS = [
  { chave: "em_analise", rotulo: "Em análise" },
  { chave: "aprovado", rotulo: "Aprovados" },
  { chave: "recusado", rotulo: "Recusados" },
  { chave: "dados_pendentes", rotulo: "Dados pendentes" },
];

type Msg = { tipo: "erro" | "ok"; texto: string } | null;

export function RevisaoProfissionais({ itens }: { itens: ProfissionalRevisao[] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [aba, setAba] = useState("em_analise");
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const lista = useMemo(() => itens.filter((i) => i.status === aba), [itens, aba]);
  const contagem = (chave: string) => itens.filter((i) => i.status === chave).length;

  async function decidir(id: string, aprovar: boolean) {
    setOcupado(id);
    setMsg(null);
    const { error } = await supabase.rpc("admin_decidir", {
      p_id: id,
      p_aprovar: aprovar,
      p_motivo: aprovar ? null : motivo,
    });
    setOcupado(null);

    if (error) {
      console.error("Erro ao decidir:", error);
      setMsg({ tipo: "erro", texto: error.code === "P0001" ? error.message : "Não foi possível salvar agora." });
      return;
    }
    setRecusando(null);
    setMotivo("");
    setMsg({ tipo: "ok", texto: aprovar ? "Profissional aprovado." : "Cadastro recusado, e o motivo foi registrado." });
    router.refresh();
  }

  return (
    <>
      <p className={styles.privacy}>
        Para cada profissional: (1) confira o nome e o número no cadastro do conselho (situação ativa; para
        psiquiatra, o RQE de psiquiatria); (2) confira o CNPJ na consulta pública da Receita Federal (situação
        “Ativa”); (3) veja se o vínculo com a instituição faz sentido.
      </p>

      <div className={styles.inline} role="tablist" aria-label="Situação">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            type="button"
            role="tab"
            aria-selected={aba === a.chave}
            className={aba === a.chave ? styles.btn : styles.btnGhost}
            onClick={() => {
              setAba(a.chave);
              setRecusando(null);
              setMsg(null);
            }}
          >
            {a.rotulo} ({contagem(a.chave)})
          </button>
        ))}
      </div>

      {msg && (
        <p className={`${styles.msg} ${msg.tipo === "erro" ? styles.msgErr : styles.msgOk}`} role="alert">
          {msg.texto}
        </p>
      )}

      {lista.length === 0 ? (
        <p className={styles.empty}>Nenhum profissional nesta situação.</p>
      ) : (
        <ul className={styles.list}>
          {lista.map((p) => {
            const consulta =
              p.conselho === "CRM"
                ? { href: "https://portal.cfm.org.br/busca-medicos", texto: "Conferir no CFM" }
                : { href: "https://cadastro.cfp.org.br", texto: "Conferir no CFP" };
            const decidivel = p.status !== "dados_pendentes";

            return (
              <li key={p.id} className={styles.entry}>
                <div className={styles.entryHead}>
                  <div>
                    <p className={styles.name}>{p.nome}</p>
                    <p className={styles.muted}>
                      {p.email} · cadastro em {dataCurta(p.criado_em)}
                    </p>
                  </div>
                </div>

                <p className={styles.muted}>
                  <strong>Registro:</strong>{" "}
                  {p.conselho && p.registro && p.uf ? `${p.conselho} ${p.registro} / ${p.uf}` : "não informado"}
                  <br />
                  <strong>Instituição:</strong> {p.instituicao ?? "não informada"}
                  <br />
                  <strong>CNPJ:</strong> {p.cnpj ? formatarCnpj(p.cnpj) : "não informado"}
                  {p.motivo && (
                    <>
                      <br />
                      <strong>Motivo da recusa:</strong> {p.motivo}
                    </>
                  )}
                </p>

                {p.conselho && (
                  <a className={styles.link} href={consulta.href} target="_blank" rel="noopener noreferrer">
                    {consulta.texto} ↗
                  </a>
                )}

                {!decidivel ? (
                  <p className={styles.muted}>Aguardando o profissional completar o cadastro.</p>
                ) : recusando === p.id ? (
                  <div className={styles.consent}>
                    <label htmlFor={`motivo-${p.id}`} className={styles.legend}>
                      Motivo da recusa (o profissional vai ler)
                    </label>
                    <textarea
                      id={`motivo-${p.id}`}
                      className={styles.textarea}
                      style={{ minHeight: 90 }}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      maxLength={300}
                    />
                    <div className={styles.inline}>
                      <button
                        type="button"
                        className={styles.btnDanger}
                        disabled={ocupado === p.id}
                        onClick={() => decidir(p.id, false)}
                      >
                        {ocupado === p.id ? "Salvando…" : "Confirmar recusa"}
                      </button>
                      <button type="button" className={styles.btnGhost} onClick={() => setRecusando(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.inline}>
                    {p.status !== "aprovado" && (
                      <button
                        type="button"
                        className={styles.btn}
                        disabled={ocupado === p.id}
                        onClick={() => decidir(p.id, true)}
                      >
                        {ocupado === p.id ? "Salvando…" : "Aprovar"}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => {
                        setRecusando(p.id);
                        setMotivo("");
                      }}
                    >
                      {p.status === "aprovado" ? "Revogar aprovação" : "Recusar"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}