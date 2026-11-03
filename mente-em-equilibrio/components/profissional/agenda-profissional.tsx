import { chaveDoDia, formatarData, formatarHora, type Consulta } from "@/lib/agenda";
import styles from "../area/consultas.module.css";

type Props = {
  consultas: Consulta[]; // já em ordem de data
  hoje: string; // "2026-11-10"
  amanha: string;
};

type Grupo = { chave: string; itens: Consulta[] };

function agrupar(consultas: Consulta[]): Grupo[] {
  const mapa = new Map<string, Consulta[]>();
  for (const c of consultas) {
    const chave = chaveDoDia(c.inicio);
    mapa.set(chave, [...(mapa.get(chave) ?? []), c]);
  }
  return [...mapa.entries()].map(([chave, itens]) => ({ chave, itens }));
}

function fimDaConsulta(c: Consulta) {
  return new Date(new Date(c.inicio).getTime() + c.duracao_min * 60_000).toISOString();
}

export function AgendaProfissional({ consultas, hoje, amanha }: Props) {
  const grupos = agrupar(consultas);

  if (grupos.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Você ainda não tem atendimentos agendados.</p>
        <p>Quando um paciente marcar um horário com você, ele aparece aqui.</p>
      </div>
    );
  }

  return (
    <div className={styles.groups}>
      {grupos.map((g) => {
        const tag = g.chave === hoje ? "Hoje" : g.chave === amanha ? "Amanhã" : null;
        const titulo = `titulo-${g.chave}`;
        return (
          <section key={g.chave} className={styles.section} aria-labelledby={titulo}>
            <h2 id={titulo} className={styles.groupTitle}>
              {formatarData(g.itens[0].inicio)}
              {tag && <span className={styles.groupTag}>{tag}</span>}
            </h2>

            <ul className={styles.list}>
              {g.itens.map((c) => (
                <li key={c.id} className={styles.card}>
                  <div className={styles.timeBox}>{formatarHora(c.inicio)}</div>
                  <div className={styles.info}>
                    <p className={styles.who}>{c.outro_nome}</p>
                    <p className={styles.meta}>
                      Paciente · até {formatarHora(fimDaConsulta(c))} · {c.duracao_min} min
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}