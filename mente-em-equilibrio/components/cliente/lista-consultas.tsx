import Link from "next/link";
import { FUSO, formatarData, formatarHora, type Consulta } from "@/lib/agenda";
import styles from "../area/consultas.module.css";

function fimDaConsulta(c: Consulta) {
  return new Date(new Date(c.inicio).getTime() + c.duracao_min * 60_000).toISOString();
}

function rotulo(c: Consulta, passada: boolean) {
  if (c.status === "cancelada") return { texto: "Cancelada", classe: styles.chipOff };
  if (!passada) return { texto: "Agendada", classe: styles.chipNext };
  if (c.status === "concluida") return { texto: "Concluída", classe: styles.chipDone };
  return { texto: "Encerrada", classe: styles.chipMuted };
}

function Item({ c, passada }: { c: Consulta; passada: boolean }) {
  const d = new Date(c.inicio);
  const parte = (opcoes: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, ...opcoes }).format(d);
  const chip = rotulo(c, passada);

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
    </li>
  );
}

type Props = {
  proximas: Consulta[];
  historico: Consulta[];
};

export function ListaConsultas({ proximas, historico }: Props) {
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
              <Item key={c.id} c={c} passada={false} />
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
              <Item key={c.id} c={c} passada />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}