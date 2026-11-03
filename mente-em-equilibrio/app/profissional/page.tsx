import { Suspense } from "react";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { ProfissionalHome } from "@/components/profissional/profissional-home";
import { chaveDoDia, type Consulta } from "@/lib/agenda";
import styles from "@/components/area/area.module.css";

async function Content() {
  const { name, email, verificado } = await requireRole("profissional");

  const displayName = name?.trim() || email || "";
  const firstName = displayName.split(/[\s@]/)[0];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("minhas_consultas");
  if (error) console.error("Erro ao buscar consultas:", error);

  const agora = Date.now();
  const hojeChave = chaveDoDia(new Date(agora));
  const fim = (c: Consulta) => new Date(c.inicio).getTime() + c.duracao_min * 60_000;

  const hoje = ((error ? [] : (data ?? [])) as Consulta[]).filter(
    (c) => c.status === "agendada" && chaveDoDia(c.inicio) === hojeChave && fim(c) > agora,
  );

  return (
    <>
      <AreaHeader displayName={displayName} />
      <ProfissionalHome firstName={firstName} verificado={verificado} hoje={hoje} />
    </>
  );
}

export default function ProfissionalPage() {
  return (
    <div className={styles.page} data-role="profissional">
      <Suspense fallback={<p className={styles.loading}>Carregando…</p>}>
        <Content />
      </Suspense>
    </div>
  );
}