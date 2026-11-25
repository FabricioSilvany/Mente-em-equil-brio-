import { Suspense } from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-roles";
import { createClient } from "@/lib/supabase/server";
import { AreaHeader } from "@/components/area/area-header";
import { PerfilView } from "@/components/area/perfil-view";
import styles from "@/components/area/area.module.css";

export const metadata: Metadata = {
  title: "Meu perfil · Mente em Equilíbrio",
  };

  async function Content() {
    const { name, email } = await requireRole("cliente");

      const supabase = await createClient();
        const { data, error } = await supabase.from("profiles").select("full_name, created_at").maybeSingle();
          if (error) console.error("Erro ao buscar o perfil:", error);

            const adm = await supabase.rpc("sou_admin");
              if (adm.error) console.error("Erro ao verificar administrador:", adm.error);

                const nome = (data?.full_name ?? name ?? "").trim() || email || "";

                  return (
                      <>
                            <AreaHeader displayName={nome} />
                                  <PerfilView
                                          papel="cliente"
                                                  nome={nome}
                                                          email={email ?? ""}
                                                                  desde={data?.created_at}
                                                                          admin={adm.data === true}
                                                                                />
                                                                                    </>
                                                                                      );
                                                                                      }

                                                                                      export default function PerfilPage() {
                                                                                        return (
                                                                                            <div className={styles.page} data-role="cliente">
                                                                                                  <Suspense fallback={<p className={styles.loading}>Carregando…</p>}>
                                                                                                          <Content />
                                                                                                                </Suspense>
                                                                                                                    </div>
                                                                                                                      );
                                                                                                                      }