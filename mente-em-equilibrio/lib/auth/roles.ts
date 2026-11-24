export type Role = "cliente" | "profissional";

/* Destino de cada tipo de conta depois do login */
export const ROUTES: Record<Role, string> = {
  cliente: "/cliente",
  profissional: "/profissional",
};


export type PerfilCadastro = {
  role?: string | null;
  cnpj?: string | null;
  instituicao_nome?: string | null;
  conselho?: string | null;
  registro_uf?: string | null;
  registro_profissional?: string | null;
  data_nascimento?: string | null;
};

/* Verdadeiro quando faltam dados obrigatórios do cadastro */
export function cadastroIncompleto(p: PerfilCadastro): boolean {
  if (p.role === "profissional") {
    return !(p.cnpj && p.instituicao_nome && p.conselho && p.registro_uf && p.registro_profissional);
  }
  return !p.data_nascimento;
}