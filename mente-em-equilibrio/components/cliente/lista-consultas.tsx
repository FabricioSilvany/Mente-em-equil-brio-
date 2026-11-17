import Link from "next/link";
import { FUSO, formatarData, formatarHora, type Consulta } from "@/lib/agenda";
import { CancelarConsulta } from "../area/cancelar-consulta";
import styles from "../area/consultas.module.css";

// precisa ser igual ao prazo da função cancelar_consulta no banco
const ANTECEDENCIA_CANCELAR_MS = 24 * 60 * 60 * 1000;

function fimDaConsulta(c: Consulta) {
  return new Date(new Date(c.inicio).getTime() + c.duracao_min * 60_000).toISOString();
}

function rotulo(c: Consulta, passada: boolean) {
  if (c.status === "cancelada") {
    const texto = !c.cancelada_por
      ? "Cancelada"
      : c.cancelada_por === c.papel
        ? "Cancelada por você"
        : c.cancelada_por === "profissional"
          ? "Cancelada pelo profissional"
          : "Cancelada pelo paciente";
    return { texto, classe: styles.chipOff };
  }
  if (!passada) return { texto: "Agendada", classe: styles.chipNext };
  if (c.status === "concluida") return { texto: "Concluída", classe: styles.chipDone };
  return { texto: "Encerrada", classe: styles.chipMuted };
}

function Item({ c, passada, agora }: { c: Consulta; passada: boolean; agora: number }) {
  const d = new Date(c.inicio);
  const parte = (opcoes: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes }).format(d);
  const chip = rotulo(c, passada);

  const futura = !passada && d.getTime() > agora;
  const dentroDoPrazo = d.getTime() - agora >= ANTECEDENCIA_CANCELAR_MS;

  return (
    <li className={`${styles.card} ${passada ? styles.past : ""}`}>
      <div className={styles.badge} aria-hidden="true">
        <span className={styles.badgeWeek}>{parte({ weekday: "short" })}</span>
        <span className={styles.badgeDay}>{parte({ day: "2-digit" })}</span>
        <span className={styles.badgeMonth}>{parte({ month: "short" })}</span>
      </div>

      <div className={styles.info}>
        <p className={styles.who}>{c.outro_nome}</p>
        <p className={styles.meta}>
          {formatarData(c.inicio)} · {formatarHora(c.inicio)} às {formatarHora(fimDaConsulta(c))}
        </p>
      </div>

      <span className={`${styles.chip} ${chip.classe}`}>{chip.texto}</span>

      {futura && (
        <CancelarConsulta
          consultaId={c.id}
          quem="paciente"
          permitido={dentroDoPrazo}
          aviso="O cancelamento pelo site é possível até 24 horas antes da consulta. Para cancelar agora, fale com o profissional."
        />
      )}
    </li>
  );
}

type Props = {
  proximas: Consulta[];
  historico: Consulta[];
  agora: number;
};

export function ListaConsultas({ proximas, historico, agora }: Props) {
  return (
    <>
      <section className={styles.section} aria-labelledby="proximas">
        <h2 id="proximas" className={styles.groupTitle}>
          Próximas consultas
        </h2>

        {proximas.length === 0 ? (
          <div className={styles.empty}>
            <p>Você não tem consultas agendadas no momento.</p>
            <Link href="/cliente/agendar" className={styles.cta}>
              Agendar consulta
            </Link>
          </div>
        ) : (
          <ul className={styles.list}>
            {proximas.map((c) => (
              <Item key={c.id} c={c} passada={false} agora={agora} />
            ))}
          </ul>
        )}
      </section>

      {historico.length > 0 && (
        <section className={styles.section} aria-labelledby="historico">
          <h2 id="historico" className={styles.groupTitle}>
            Histórico
          </h2>
          <ul className={styles.list}>
            {historico.map((c) => (
              <Item key={c.id} c={c} passada agora={agora} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}