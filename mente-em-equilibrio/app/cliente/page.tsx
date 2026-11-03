import { Suspense } from "react";
import { requireRole } from "@/lib/auth/require-roles";
import { AreaHeader } from "@/components/area/area-header";
import { ClienteHome } from "@/components/cliente/cliente-home";
import styles from "@/components/area/area.module.css";

async function Content() {
  const { name, email } = await requireRole("cliente");

  const displayName = name?.trim() || email || "";
  const firstName = displayName.split(/[\s@]/)[0];

  return (
    <>
      <AreaHeader displayName={displayName} />
      <ClienteHome firstName={firstName} />
    </>
  );
}

export default function ClientePage() {
  return (
    <div className={styles.page} data-role="cliente">
      <Suspense fallback={<p className={styles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}