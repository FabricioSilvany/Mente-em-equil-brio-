import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES, cadastroIncompleto, type Role } from "./roles";

export async function requireRole(role: Role) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "role, full_name, verificado, status_verificacao, motivo_recusa, cnpj, instituicao_nome, conselho, registro_uf, registro_profissional, data_nascimento",
    )
    .eq("id", claims.sub)
    .maybeSingle();

  if (!profile) redirect("/");
  if (profile.role !== role) redirect(ROUTES[profile.role as Role]);
  if (cadastroIncompleto(profile)) redirect("/completar-cadastro");

  return {
    email: claims.email as string | undefined,
    name: (profile.full_name as string | null) ?? null,
    verificado: profile.verificado as boolean,
    status: (profile.status_verificacao as string | null) ?? "em_analise",
    motivoRecusa: (profile.motivo_recusa as string | null) ?? null,
  };
}