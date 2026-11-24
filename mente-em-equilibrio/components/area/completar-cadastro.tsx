"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ROUTES, type Role } from "@/lib/auth/roles";
import { UFS, cnpjValido, maiorDeIdade, normalizarCnpj } from "@/lib/documentos";
import { LogoutButton } from "@/components/logout-button";
import area from "./area.module.css";
import diario from "./diario.module.css";
import styles from "./cadastro.module.css";

type Inicial = {
  cnpj: string;
  instituicao: string;
  conselho: string;
  uf: string;
  registro: string;
  nascimento: string;
};

type Props = {
  papel: Role;
  nome: string;
  motivoRecusa: string | null;
  inicial: Inicial;
};

export function CompletarCadastro({ papel, nome, motivoRecusa, inicial }: Props) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [cnpj, setCnpj] = useState(inicial.cnpj);
  const [instituicao, setInstituicao] = useState(inicial.instituicao);
  const [conselho, setConselho] = useState(inicial.conselho === "CRM" ? "CRM" : "CRP");
  const [uf, setUf] = useState(inicial.uf);
  const [registro, setRegistro] = useState(inicial.registro);
  const [nascimento, setNascimento] = useState(inicial.nascimento);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const profissional = papel === "profissional";

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (profissional) {
      if (instituicao.trim().length < 3) return setErro("Informe a instituição onde você atua.");
      if (!cnpjValido(cnpj)) return setErro("CNPJ inválido. Confira os dígitos.");
      if (!uf) return setErro("Escolha a UF do seu conselho.");
      if (registro.length < 3) return setErro("Informe o número do seu registro (só números).");
    } else if (!maiorDeIdade(nascimento)) {
      return setErro("O cadastro é para maiores de 18 anos. Confira a data de nascimento.");
    }

    setEnviando(true);
    const { error } = profissional
      ? await supabase.rpc("completar_cadastro", {
          p_cnpj: normalizarCnpj(cnpj),
          p_instituicao: instituicao.trim(),
          p_conselho: conselho,
          p_uf: uf,
          p_registro: registro,
        })
      : await supabase.rpc("completar_cadastro", { p_nascimento: nascimento });
    setEnviando(false);

    if (error) {
      console.error("Erro ao completar o cadastro:", error);
      setErro(error.code === "P0001" ? error.message : "Não foi possível salvar agora. Tente novamente.");
      return;
    }

    router.push(ROUTES[papel]);
    router.refresh();
  }

  return (
    <main className={area.container}>
      <div className={styles.top}>
        <span className={area.eyebrow} style={{ margin: 0 }}>
          Mente em Equilíbrio
        </span>
        <LogoutButton
          label="Sair"
          variant="outline"
          className="rounded-full border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
        />
      </div>

      <div>
        <h1 className={area.title}>{motivoRecusa ? "Corrija seus dados" : "Complete seu cadastro"}</h1>
        <p className={area.lead}>
          {nome ? `${nome.split(" ")[0]}, ` : ""}
          {profissional
            ? "para proteger os pacientes, conferimos o seu registro no conselho e o CNPJ da instituição antes de liberar o acesso."
            : "precisamos da sua data de nascimento. O uso do site é para maiores de 18 anos."}
        </p>
      </div>

      {motivoRecusa && (
        <p className={`${diario.msg} ${diario.msgErr}`} role="alert">
          Motivo informado na análise: {motivoRecusa}
        </p>
      )}

      <form className={diario.card} onSubmit={salvar} noValidate>
        {profissional ? (
          <>
            <div className={styles.field}>
              <label htmlFor="instituicao" className={styles.label}>
                Instituição onde você atua
              </label>
              <input
                id="instituicao"
                className={styles.control}
                maxLength={120}
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="cnpj" className={styles.label}>
                CNPJ da instituição
              </label>
              <input
                id="cnpj"
                className={styles.control}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                autoComplete="off"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value.toUpperCase())}
              />
              <p className={styles.hint}>Aceita o CNPJ numérico e o novo formato com letras.</p>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label htmlFor="conselho" className={styles.label}>
                  Conselho
                </label>
                <select
                  id="conselho"
                  className={styles.control}
                  value={conselho}
                  onChange={(e) => setConselho(e.target.value)}
                >
                  <option value="CRP">CRP (Psicologia)</option>
                  <option value="CRM">CRM (Medicina)</option>
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="uf" className={styles.label}>
                  UF
                </label>
                <select id="uf" className={styles.control} value={uf} onChange={(e) => setUf(e.target.value)}>
                  <option value="">Escolha</option>
                  {UFS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="registro" className={styles.label}>
                Número do registro
              </label>
              <input
                id="registro"
                className={styles.control}
                inputMode="numeric"
                placeholder="Somente números"
                maxLength={10}
                autoComplete="off"
                value={registro}
                onChange={(e) => setRegistro(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </>
        ) : (
          <div className={styles.field}>
            <label htmlFor="nascimento" className={styles.label}>
              Data de nascimento
            </label>
            <input
              id="nascimento"
              type="date"
              className={styles.control}
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
            />
          </div>
        )}

        {erro && (
          <p className={`${diario.msg} ${diario.msgErr}`} role="alert">
            {erro}
          </p>
        )}

        <button type="submit" className={diario.btn} disabled={enviando}>
          {enviando ? "Salvando…" : profissional ? "Enviar para análise" : "Salvar e continuar"}
        </button>
      </form>
    </main>
  );
}