"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import styles from "./area.module.css";

export function AreaHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname() ?? "";
  const profissional = pathname.startsWith("/profissional");

  const inicio = profissional ? "/profissional" : "/cliente";
  const perfilHref = `${inicio}/perfil`;
  const papel = profissional ? "Profissional" : "Paciente";
  const noPerfil = pathname === perfilHref;
  const inicial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.accountGroup}>
          <Link
            href={perfilHref}
            className={`${styles.account} ${noPerfil ? styles.accountActive : ""}`}
            aria-current={noPerfil ? "page" : undefined}
            aria-label={`Meu perfil, ${displayName}`}
          >
            <span className={styles.avatar} aria-hidden="true">
              {inicial}
            </span>
            <span className={styles.accountText}>
              <span className={styles.accountName}>{displayName}</span>
              <span className={styles.accountRole}>{papel} · Meu perfil</span>
            </span>
          </Link>

          <LogoutButton
            label="Sair"
            variant="outline"
            className="shrink-0 rounded-full border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--accent-soft)] hover:text-[var(--ink)]"
          />
        </div>

        <Link href={inicio} className={styles.brand}>
          <Leaf className={styles.brandMark} size={26} aria-hidden="true" />
          <span>Mente em Equilíbrio</span>
        </Link>
      </div>
    </header>
  );
}