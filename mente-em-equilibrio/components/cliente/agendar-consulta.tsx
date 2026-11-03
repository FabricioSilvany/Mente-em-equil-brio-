"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DIAS_A_FRENTE,
  DURACAO_MIN,
  formatarData,
  formatarHora,
  gerarDias,
  horariosLivres,
  intervaloBusca,
  periodoDoHorario,
  type Dia,
} from "@/lib/agenda";
import styles from "./agendar.module.css";

type Profissional = { id: string; nome: string };
type Status = "idle" | "carregando" | "pronto" | "erro";

const ETAPAS = ["Profissional", "Dia", "Horário", "Confirmar"];
const PERIODOS = ["Manhã", "Tarde"] as const;
const INTERVALO_ATUALIZACAO_MS = 20_000;

function rolarAte(el: HTMLElement | null) {
  const reduz =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el?.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "nearest" });
}

export function AgendarConsulta({ profissionais }: { profissionais: Profissional[] }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [dias, setDias] = useState<Dia[]>([]);
  const [profId, setProfId] = useState<string | null>(
    profissionais.length === 1 ? profissionais[0].id : null,
  );
  const [diaChave, setDiaChave] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [concluida, setConcluida] = useState<{ nome: string; inicio: string } | null>(null);

  const slotRef = useRef<string | null>(null);
  const reqRef = useRef(0);
  const rolarParaDias = useRef(false);
  const diaRef = useRef<HTMLElement>(null);
  const horaRef = useRef<HTMLElement>(null);
  const resumoRef = useRef<HTMLElement>(null);

  /* Valores derivados: só aparece o que está livre */
  const diasLivres = useMemo(() => horariosLivres(dias, ocupados), [dias, ocupados]);
  const diaAtual = diasLivres.find((d) => d.chave === diaChave) ?? null;
  const slotValido = diaAtual && slot && diaAtual.slots.includes(slot) ? slot : null;
  const profAtual = profissionais.find((p) => p.id === profId) ?? null;
  const etapa = !profId ? 0 : !diaAtual ? 1 : !slotValido ? 2 : 3;

  useEffect(() => {
    slotRef.current = slot;
  }, [slot]);

  /* Os dias são gerados só no navegador, para não divergir entre servidor e cliente */
  useEffect(() => {
    setDias(gerarDias());
  }, []);

  /* Busca os horários ocupados do profissional (e os seus próprios) */
  const carregarOcupados = useCallback(
    async (inicial: boolean) => {
      if (!profId) return;
      const req = ++reqRef.current;
      const { de, ate } = intervaloBusca(gerarDias());

      const { data, error } = await supabase.rpc("horarios_ocupados", {
        p_profissional: profId,
        p_de: de,
        p_ate: ate,
      });

      if (req !== reqRef.current) return; // resposta antiga: ignora

      if (error) {
        console.error("Erro ao buscar horários:", error);
        if (inicial) setStatus("erro");
        return;
      }

      const novo = new Set<number>(((data ?? []) as string[]).map((s) => new Date(s).getTime()));
      setOcupados(novo);
      setStatus("pronto");

      // Se alguém ocupou o horário que você tinha escolhido, desmarca e avisa
      const escolhido = slotRef.current;
      if (escolhido && novo.has(new Date(escolhido).getTime())) {
        setSlot(null);
        setMsg("O horário que você escolheu acabou de ser ocupado. Escolha outro.");
      }
    },
    [profId, supabase],
  );

  /* Ao escolher o profissional: carrega e depois atualiza sozinho */
  useEffect(() => {
    if (!profId) return;
    setStatus("carregando");
    setOcupados(new Set());
    carregarOcupados(true);

    const atualizar = () => {
      if (document.visibilityState !== "visible") return;
      setDias(gerarDias());
      carregarOcupados(false);
    };

    const timer = setInterval(atualizar, INTERVALO_ATUALIZACAO_MS);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", atualizar);
    };
  }, [profId, carregarOcupados]);

  /* Se o dia escolhido lotou enquanto a pessoa olhava, volta para a escolha de dia */
  useEffect(() => {
    if (status === "pronto" && diaChave && !diaAtual) {
      setDiaChave(null);
      setSlot(null);
      setMsg("Os horários desse dia acabaram. Escolha outro dia.");
    }
  }, [status, diaChave, diaAtual]);

  /* Rolagem suave para o próximo passo */
  useEffect(() => {
    if (status === "pronto" && rolarParaDias.current) {
      rolarParaDias.current = false;
      rolarAte(diaRef.current);
    }
  }, [status]);

  useEffect(() => {
    if (diaChave) rolarAte(horaRef.current);
  }, [diaChave]);

  useEffect(() => {
    if (slotValido) rolarAte(resumoRef.current);
  }, [slotValido]);

  function escolherProfissional(id: string) {
    if (id === profId) return;
    setProfId(id);
    setDiaChave(null);
    setSlot(null);
    setMsg(null);
    rolarParaDias.current = true;
  }

  function escolherDia(chave: string) {
    setDiaChave(chave);
    setSlot(null);
    setMsg(null);
  }

  function tentarNovamente() {
    setStatus("carregando");
    setMsg(null);
    carregarOcupados(true);
  }

  async function confirmar() {
    if (!profId || !slotValido || !profAtual) return;
    setEnviando(true);
    setMsg(null);

    const { error } = await supabase.rpc("agendar_consulta", {
      p_profissional: profId,
      p_inicio: slotValido,
    });

    if (error) {
      console.error("Erro ao agendar:", error);
      // P0001 = mensagens que escrevi no banco (já estão em português e são seguras de mostrar)
      setMsg(error.code === "P0001" ? error.message : "Não foi possível agendar agora. Tente novamente.");
      setSlot(null);
      setEnviando(false);
      carregarOcupados(false); // atualiza para o horário ocupado sumir da lista
      return;
    }

    setConcluida({ nome: profAtual.nome, inicio: slotValido });
    setEnviando(false);
    router.refresh();
  }

  function agendarOutra() {
    setConcluida(null);
    setSlot(null);
    setDiaChave(null);
    setMsg(null);
    setStatus("carregando");
    carregarOcupados(true);
  }

  /* ---------- Tela de sucesso ---------- */
  if (concluida) {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successIcon} aria-hidden="true">
          <CalendarCheck size={30} />
        </span>
        <h2 className={styles.successTitle}>Consulta agendada!</h2>
        <p className={styles.successText}>
          {concluida.nome}
          <br />
          {formatarData(concluida.inicio)}, às {formatarHora(concluida.inicio)} · {DURACAO_MIN} minutos
        </p>
        <div className={styles.successActions}>
          <Link href="/cliente/consultas" className={styles.confirm}>
            Ver minhas consultas
          </Link>
          <button type="button" className={styles.secondary} onClick={agendarOutra}>
            Agendar outra consulta
          </button>
        </div>
      </div>
    );
  }

  const placeholder = (texto: string) => <span className={styles.placeholder}>{texto}</span>;

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        {/* Progresso */}
        <ol className={styles.stepper} aria-label="Etapas do agendamento">
          {ETAPAS.map((nome, i) => (
            <li
              key={nome}
              className={`${styles.stepperItem} ${i < etapa ? styles.stepDone : ""} ${
                i === etapa ? styles.stepCurrent : ""
              }`}
              aria-current={i === etapa ? "step" : undefined}
            >
              <span className={styles.stepperDot}>
                {i < etapa ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
              <span className={styles.stepperLabel}>{nome}</span>
            </li>
          ))}
        </ol>

        {msg && (
          <p className={`${styles.msg} ${styles.msgError}`} role="alert">
            {msg}
          </p>
        )}

        {/* Passo 1: profissional */}
        <section className={styles.step} aria-labelledby="passo-prof">
          <h2 id="passo-prof" className={styles.stepTitle}>
            Com quem você quer se consultar?
          </h2>

          {profissionais.length === 0 ? (
            <p className={styles.empty}>
              Ainda não há profissionais disponíveis para agendamento. Volte em breve.
            </p>
          ) : (
            <div className={styles.pros}>
              {profissionais.map((p) => {
                const ativo = p.id === profId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.pro} ${ativo ? styles.active : ""}`}
                    aria-pressed={ativo}
                    onClick={() => escolherProfissional(p.id)}
                  >
                    <span className={styles.avatar} aria-hidden="true">
                      {p.nome.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.proName}>{p.nome}</span>
                    {ativo && <Check className={styles.proCheck} size={20} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Carregando / erro */}
        {profId && status === "carregando" && (
          <section className={styles.step} role="status">
            <p className={styles.empty}>Buscando horários disponíveis…</p>
          </section>
        )}

        {profId && status === "erro" && (
          <section className={styles.step}>
            <div className={styles.retry}>
              <p className={styles.empty}>Não foi possível carregar os horários agora.</p>
              <button type="button" className={styles.secondary} onClick={tentarNovamente}>
                Tentar novamente
              </button>
            </div>
          </section>
        )}

        {/* Passo 2: dia (só dias com horário livre) */}
        {profId && status === "pronto" && (
          <section ref={diaRef} className={styles.step} aria-labelledby="passo-dia">
            <h2 id="passo-dia" className={styles.stepTitle}>
              Qual dia é melhor para você?
            </h2>

            {diasLivres.length === 0 ? (
              <p className={styles.empty}>
                {profAtual?.nome ?? "Este profissional"} não tem horários livres nos próximos{" "}
                {DIAS_A_FRENTE} dias. Escolha outro profissional ou volte mais tarde.
              </p>
            ) : (
              <>
                <p className={styles.stepHint}>Mostramos apenas os dias que ainda têm horário livre.</p>
                <div className={styles.days}>
                  {diasLivres.map((d) => {
                    const ativo = d.chave === diaChave;
                    const n = d.slots.length;
                    return (
                      <button
                        key={d.chave}
                        type="button"
                        className={`${styles.day} ${ativo ? styles.active : ""}`}
                        aria-pressed={ativo}
                        aria-label={`${d.semana}, ${d.numero} de ${d.mes}, ${n} ${
                          n === 1 ? "horário livre" : "horários livres"
                        }`}
                        onClick={() => escolherDia(d.chave)}
                      >
                        <span className={styles.dayWeek}>{d.semana}</span>
                        <span className={styles.dayNum}>{d.numero}</span>
                        <span className={styles.dayMonth}>{d.mes}</span>
                        <span className={styles.dayFree}>
                          {n} {n === 1 ? "horário" : "horários"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* Passo 3: horário (só horários livres) */}
        {profId && status === "pronto" && diaAtual && (
          <section ref={horaRef} className={styles.step} aria-labelledby="passo-hora">
            <h2 id="passo-hora" className={styles.stepTitle}>
              Qual horário?
            </h2>
            <p className={styles.stepHint}>
              Cada consulta dura {DURACAO_MIN} minutos. Horários em que você já tem outra consulta também não
              aparecem.
            </p>

            <div className={styles.periods}>
              {PERIODOS.map((periodo) => {
                const doPeriodo = diaAtual.slots.filter((s) => periodoDoHorario(s) === periodo);
                if (doPeriodo.length === 0) return null;
                return (
                  <div key={periodo}>
                    <h3 className={styles.period}>{periodo}</h3>
                    <div className={styles.slots}>
                      {doPeriodo.map((s) => {
                        const ativo = s === slotValido;
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`${styles.slot} ${ativo ? styles.active : ""}`}
                            aria-pressed={ativo}
                            onClick={() => {
                              setSlot(s);
                              setMsg(null);
                            }}
                          >
                            {formatarHora(s)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Resumo e confirmação */}
      <aside className={styles.summaryCol}>
        <section ref={resumoRef} className={styles.summary} aria-labelledby="resumo-titulo">
          <h2 id="resumo-titulo" className={styles.summaryTitle}>
            Resumo da consulta
          </h2>

          <dl className={styles.summaryList}>
            <div>
              <dt>Profissional</dt>
              <dd>{profAtual ? profAtual.nome : placeholder("Escolha um profissional")}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>{diaAtual ? formatarData(diaAtual.slots[0]) : placeholder("Escolha um dia")}</dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>
                {slotValido
                  ? `${formatarHora(slotValido)} · ${DURACAO_MIN} min`
                  : placeholder("Escolha um horário")}
              </dd>
            </div>
          </dl>

          <button type="button" className={styles.confirm} onClick={confirmar} disabled={!slotValido || enviando}>
            {enviando ? "Agendando…" : "Confirmar agendamento"}
          </button>
          <p className={styles.fine}>Depois de confirmar, a consulta aparece em Minhas consultas.</p>
        </section>
      </aside>
    </div>
  );
}