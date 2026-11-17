import { FUSO } from "@/lib/agenda";

export const LIMITE_TEXTO = 4000;

export const HUMORES = [
  { valor: 1, rotulo: "Muito mal", emoji: "😞" },
  { valor: 2, rotulo: "Mal", emoji: "🙁" },
  { valor: 3, rotulo: "Mais ou menos", emoji: "😐" },
  { valor: 4, rotulo: "Bem", emoji: "🙂" },
  { valor: 5, rotulo: "Muito bem", emoji: "😄" },
];

export function humorDe(valor: number) {
  return HUMORES.find((h) => h.valor === valor) ?? HUMORES[2];
}

export type Entrada = {
  id: string;
  criado_em: string;
  humor: number;
  texto: string;
  privada?: boolean;
};

export type ProfissionalVinculado = {
  profissional_id: string;
  nome: string;
  desde: string;
  diario_compartilhado: boolean;
  incluir_anteriores: boolean;
  checkins_compartilhado: boolean;
  checkins_incluir_anteriores: boolean;
};

export type PacienteVinculado = {
  paciente_id: string;
  nome: string;
  desde: string;
  diario_compartilhado: boolean;
  checkins_compartilhado: boolean;
  proxima_consulta: string | null;
};

export type Leitura = { nome: string; lido_em: string; qtd: number; tipo: "diario" | "checkin" };

export function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: FUSO,
  }).format(new Date(iso));
}