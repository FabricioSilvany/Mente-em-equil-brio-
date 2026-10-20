export type Role = "cliente" | "profissional";

/* Destino de cada tipo de conta depois do login */
export const ROUTES: Record<Role, string> = {
  cliente: "/cliente",
  profissional: "/profissional",
};