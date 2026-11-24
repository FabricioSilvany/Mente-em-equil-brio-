import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, UserRound, Users, type LucideIcon } from "lucide-react";
import { formatarHora, type Consulta } from "@/lib/agenda";
import styles from "../area/area.module.css";
import lista from "../area/consultas.module.css";

type Atalho = {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
  semValidacao?: boolean;
};

const ATALHOS: Atalho[] = [
  {
    icon: CalendarDays,
    title: "Minha agenda",
    text: "Veja quem marcou consulta com você, dia a dia.",
    href: "/profissional/agenda",
  },
  {
    icon: Users,
    title: "Meus pacientes",
    text: "Veja seus pacientes, convide novos e leia o diário compartilhado.",
    href: "/profissional/pacientes",
  },
  {
    icon: Clock,
    title: "Disponibilidade",
    text: "Defina os dias e horários em que você atende.",
  },
  {
    icon: UserRound,
    title: "Perfil profissional",
    text: "Consulte os dados do seu cadastro.",
    href: "/profissional/perfil",
    semValidacao: true,
  },
];

type Props = {
  firstName: string;
  verificado: boolean;
  status: string;
  motivoRecusa: string | null;
  hoje: Consulta[];
};

export function ProfissionalHome({ firstName, verificado, status, motivoRecusa, hoje }: Props) {
  return (
    <main className={styles.container}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Área profissional</p>
        <h1 className={styles.title}>{firstName ? `Olá, ${firstName}` : "Olá"}</h1>
        <p className={styles.lead}>
          Aqui você organiza a sua rotina e acompanha o cuidado dos seus pacientes.
        </p>
        <span className={`${styles.status} ${verificado ? styles.statusOk : styles.statusPending}`}>
          {verificado ? "Cadastro verificado" : status === "recusado" ? "Cadastro recusado" : "Cadastro em análise"}
        </span>
      </section>

      {verificado ? (
        <section className={styles.panel} aria-labelledby="hoje">
          <div>
            <h2 id="hoje" className={styles.sectionTitle}>
              Atendimentos de hoje
            </h2>
            {hoje.length === 0 ? (
              <p className={styles.panelText}>Você não tem atendimentos agendados para hoje.</p>
            ) : (
              <ul className={lista.mini}>
                {hoje.map((c) => (
                  <li key={c.id}>
                    <span className={lista.miniHora}>{formatarHora(c.inicio)}</span>
                    {c.outro_nome}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/profissional/agenda" className={lista.cta}>
            Ver agenda
          </Link>
        </section>
      ) : (
        <section className={styles.notice} aria-labelledby="analise">
          {status === "recusado" ? (
            <>
              <h2 id="analise" className={styles.noticeTitle}>
                Não conseguimos validar o seu cadastro
              </h2>
              <p className={styles.noticeText}>
                {motivoRecusa ? `Motivo informado na análise: ${motivoRecusa}. ` : ""}
                Corrija os dados e envie de novo para uma nova análise.
              </p>
              <p style={{ margin: "12px 0 0" }}>
                <Link href="/completar-cadastro" className={lista.cta}>
                  Corrigir meus dados
                </Link>
              </p>
            </>
          ) : (
            <>
              <h2 id="analise" className={styles.noticeTitle}>
                Estamos validando o seu registro profissional
              </h2>
              <p className={styles.noticeText}>
                Conferimos o seu registro no conselho e o CNPJ da instituição. Assim que a validação for concluída,
                o acesso completo será liberado nesta tela.
              </p>
            </>
          )}
        </section>
      )}

      <section aria-labelledby="atalhos">
        <h2 id="atalhos" className={styles.sectionTitle}>
          O que você quer fazer?
        </h2>
        <div className={styles.grid}>
          {ATALHOS.map(({ icon: Icon, title, text, href, semValidacao }) => {
            const ativo = Boolean(href) && (verificado || Boolean(semValidacao));
            const conteudo = (
              <>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={24} />
                </span>
                <h3 className={styles.itemTitle}>{title}</h3>
                <p className={styles.itemText}>{text}</p>
                {ativo ? (
                  <span className={styles.open}>
                    Abrir <ArrowRight size={16} aria-hidden="true" />
                  </span>
                ) : (
                  <span className={styles.soon}>{!verificado ? "Após validação" : "Em breve"}</span>
                )}
              </>
            );

            return ativo && href ? (
              <Link key={title} href={href} className={`${styles.item} ${styles.itemLink}`}>
                {conteudo}
              </Link>
            ) : (
              <article key={title} className={`${styles.item} ${styles.itemSoon}`}>
                {conteudo}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}