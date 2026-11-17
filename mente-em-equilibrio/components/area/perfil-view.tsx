import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FUSO } from "@/lib/agenda";
import styles from "./area.module.css";

type Props = {
  papel: "cliente" | "profissional";
  nome: string;
  email: string;
  registro?: string | null;
  verificado?: boolean;
  desde?: string | null;
};

export function PerfilView({ papel, nome, email, registro, verificado, desde }: Props) {
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";
  const voltar = papel === "profissional" ? "/profissional" : "/cliente";
  const desdeTexto = desde
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: FUSO,
      }).format(new Date(desde))
    : null;

  return (
    <main className={styles.container}>
      <Link href={voltar} className={styles.back}>
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar ao início
      </Link>

      <section className={styles.profile} aria-labelledby="perfil-nome">
        <div className={styles.profileBanner} aria-hidden="true" />
        <div className={styles.profileBody}>
          <div className={styles.profileAvatar} aria-hidden="true">
            {inicial}
          </div>
          <h1 id="perfil-nome" className={styles.profileName}>
            {nome}
          </h1>
          <p className={styles.profileRole}>
            {papel === "profissional" ? "Profissional de saúde" : "Paciente"}
          </p>

          {papel === "profissional" && (
            <span className={`${styles.status} ${verificado ? styles.statusOk : styles.statusPending}`}>
              {verificado ? "Cadastro verificado" : "Cadastro em análise"}
            </span>
          )}

          <dl className={styles.details}>
            <div>
              <dt>E-mail</dt>
              <dd>{email || "—"}</dd>
            </div>
            {papel === "profissional" && (
              <div>
                <dt>Registro profissional</dt>
                <dd>{registro || "—"}</dd>
              </div>
            )}
            {desdeTexto && (
              <div>
                <dt>Conta criada em</dt>
                <dd>{desdeTexto}</dd>
              </div>
            )}
          </dl>

          <p className={styles.note}>A edição dos dados do perfil estará disponível em breve.</p>
        </div>
      </section>
    </main>
  );
}