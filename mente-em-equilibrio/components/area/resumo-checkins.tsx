import { calcularResumo, type Checkin, type Contagem } from "@/lib/checkin";
import styles from "./checkin.module.css";

type Props = {
  checkins: Checkin[];
  agora: number;
  dias?: number;
};

function Barras({ itens }: { itens: Contagem[] }) {
  return (
    <ul className={styles.barList}>
      {itens.slice(0, 6).map((i) => (
        <li key={i.chave}>
          <span>{i.rotulo}</span>
          <span className={styles.barTrack} aria-hidden="true">
            <span className={styles.barFill} style={{ width: `${i.pct}%` }} />
          </span>
          <span className={styles.barValue}>
            {i.qtd}× · {i.pct}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ResumoCheckins({ checkins, agora, dias = 30 }: Props) {
  const r = calcularResumo(checkins, agora, dias);

  if (r.total === 0) {
    return (
      <section className={styles.resumo} aria-labelledby="resumo-titulo">
        <h2 id="resumo-titulo" className={styles.titulo}>
          Resumo dos últimos {dias} dias
        </h2>
        <p className={styles.muted}>Ainda não há check-ins neste período.</p>
      </section>
    );
  }

  const media = (r.mediaHumor ?? 0).toFixed(1).replace(".", ",");

  return (
    <section className={styles.resumo} aria-labelledby="resumo-titulo">
      <div>
        <h2 id="resumo-titulo" className={styles.titulo}>
          Resumo dos últimos {dias} dias
        </h2>
        <p className={styles.muted}>
          Baseado em {r.total} {r.total === 1 ? "check-in" : "check-ins"}. São relatos pessoais que ajudam a
          conversar; não são um diagnóstico.
        </p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statValue}>{r.total}</p>
          <p className={styles.statLabel}>check-ins</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{media}</p>
          <p className={styles.statLabel}>humor médio (de 1 a 5)</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{r.diasComRegistro}</p>
          <p className={styles.statLabel}>dias com registro</p>
        </div>
      </div>

      <div className={styles.panel}>
        <h3 className={styles.subtitulo}>Humor ao longo dos dias</h3>
        <div
          className={styles.chart}
          role="img"
          aria-label={`Humor diário nos últimos ${dias} dias. Média de ${media} em 5, em ${r.diasComRegistro} dias com registro.`}
        >
          {r.dias.map((d) => {
            const nivel = d.media === null ? 0 : Math.round(d.media);
            const data = `${d.chave.slice(8, 10)}/${d.chave.slice(5, 7)}`;
            return (
              <div
                key={d.chave}
                className={styles.col}
                title={d.media === null ? `${data}: sem registro` : `${data}: humor ${d.media.toFixed(1).replace(".", ",")}`}
              >
                <span
                  className={`${styles.colBar} ${nivel ? styles[`h${nivel}`] : ""}`}
                  style={{ height: d.media === null ? "4px" : `${(d.media / 5) * 100}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className={styles.axis}>
          <span>há {dias} dias</span>
          <span>hoje</span>
        </div>
        <p className={styles.scale}>1 = muito mal · 5 = muito bem. Dias sem barra colorida não tiveram registro.</p>
      </div>

      <div className={styles.blocks}>
        <div className={styles.panel}>
          <h3 className={styles.subtitulo}>O que mais pesou</h3>
          {r.motivos.length > 0 ? (
            <Barras itens={r.motivos} />
          ) : (
            <p className={styles.muted}>Nenhum motivo foi marcado.</p>
          )}
        </div>

        <div className={styles.panel}>
          <h3 className={styles.subtitulo}>Onde aconteceu</h3>
          {r.locais.length > 0 ? (
            <Barras itens={r.locais} />
          ) : (
            <p className={styles.muted}>Nenhum lugar foi marcado.</p>
          )}
        </div>

        {r.qtdDificeis > 0 && r.motivosDificeis.length > 0 && (
          <div className={`${styles.panel} ${styles.wide}`}>
            <h3 className={styles.subtitulo}>Nos dias mais difíceis</h3>
            <p className={styles.muted} style={{ marginBottom: 12 }}>
              Em {r.qtdDificeis} {r.qtdDificeis === 1 ? "check-in" : "check-ins"} com humor 1 ou 2, estes foram os
              motivos mais marcados:
            </p>
            <Barras itens={r.motivosDificeis} />
          </div>
        )}
      </div>
    </section>
  );
}