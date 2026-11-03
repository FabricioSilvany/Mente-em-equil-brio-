import { LogoutButton } from "@/components/logout-button";
import styles from "./cliente.module.css";

export function ClienteHeader({ displayName }: { displayName: string }) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <span className={styles.brand}>Mente em Equilíbrio</span>

        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
          <span className={styles.userName}>{displayName}</span>
          <LogoutButton
            label="Sair"
            variant="outline"
            className="border-[#cfdde0] bg-white text-[#16303a] hover:bg-[#e1eff0] hover:text-[#16303a]"
          />
        </div>
      </div>
    </header>
  );
}