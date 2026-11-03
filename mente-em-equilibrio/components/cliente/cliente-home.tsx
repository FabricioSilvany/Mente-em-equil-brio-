import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  HeartHandshake,
  NotebookPen,
  Phone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import styles from "../area/area.module.css";

type Atalho = {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
};

const ATALHOS: Atalho[] = [
  {
    icon: CalendarDays,
    title: "Agendar consulta",
    text: "Escolha um profissional e um horário que combine com você.",
    href: "/cliente/agendar",
  },
  {
    icon: CalendarClock,
    title: "Minhas consultas",
    text: "Veja as consultas que você marcou e o seu histórico.",
    href: "/cliente/consultas",
  },
  {
    icon: HeartHandshake,
    title: "Meus profissionais",
    text: "Veja quem acompanha o seu cuidado.",
  },
  {
    icon: NotebookPen,
    title: "Diário de bem-estar",
    text: "Registre como você se sente, no seu ritmo.",
  },
  {
    icon: UserRound,
    title: "Meu perfil",
    text: "Atualize seus dados e preferências.",
  },
];

export function ClienteHome({ firstName }: { firstName: string }) {
  return (
    <main className={styles.container}>
      <section>
        <p className={styles.eyebrow}>Seu espaço</p>
        <h1 className={styles.title}>
          {firstName ? `Olá, ${firstName}` : "Olá"}
        </h1>
        <p className={styles.lead}>
          Que bom ter você aqui. Este é o seu espaço para cuidar da mente no seu
          ritmo.
        </p>
      </section>

      <section aria-labelledby="atalhos">
        <h2 id="atalhos" className={styles.sectionTitle}>
          O que você quer fazer?
        </h2>
        <div className={styles.grid}>
          {ATALHOS.map(({ icon: Icon, title, text, href }) => {
            const conteudo = (
              <>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={22} />
                </span>
                <h3 className={styles.itemTitle}>{title}</h3>
                <p className={styles.itemText}>{text}</p>
                <span className={styles.soon}>{href ? "Disponível" : "Em breve"}</span>
              </>
            );

            return href ? (
              <Link
                key={title}
                href={href}
                className={`${styles.item} transition-colors hover:border-[var(--accent)]`}
              >
                {conteudo}
              </Link>
            ) : (
              <article key={title} className={styles.item}>
                {conteudo}
              </article>
            );
          })}
        </div>
      </section>

      <aside className={styles.help} aria-labelledby="apoio">
        <div>
          <h2 id="apoio" className={styles.helpTitle}>
            Precisando de ajuda agora?
          </h2>
          <p className={styles.helpText}>
            O CVV atende 24 horas por dia, de graça.
          </p>
        </div>
        <a className={styles.helpLink} href="tel:188">
          <Phone size={18} aria-hidden="true" />
          Ligar 188
        </a>
      </aside>
    </main>
  );
}