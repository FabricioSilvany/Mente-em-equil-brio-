import { chaveDoDia } from "@/lib/agenda";

export const MAX_MOTIVOS = 8;
export const MAX_LOCAIS = 6;
export const LIMITE_NOTA = 1000;

const DIA_MS = 24 * 60 * 60 * 1000;

type Opcao = { chave: string; rotulo: string };

// As chaves só podem ter letras minúsculas e "_" (o banco valida isso)
export const MOTIVOS: Opcao[] = [
  { chave: "trabalho", rotulo: "Trabalho" },
  { chave: "estudos", rotulo: "Estudos" },
  { chave: "familia", rotulo: "Família" },
  { chave: "relacionamento", rotulo: "Relacionamento" },
  { chave: "amizades", rotulo: "Amizades" },
  { chave: "saude", rotulo: "Saúde" },
  { chave: "sono", rotulo: "Sono" },
  { chave: "dinheiro", rotulo: "Dinheiro" },
  { chave: "solidao", rotulo: "Solidão" },
  { chave: "outro", rotulo: "Outro" },
];

export const LOCAIS: Opcao[] = [
  { chave: "casa", rotulo: "Em casa" },
  { chave: "trabalho", rotulo: "No trabalho" },
  { chave: "escola", rotulo: "Escola ou faculdade" },
  { chave: "transito", rotulo: "No trânsito" },
  { chave: "online", rotulo: "Online ou redes sociais" },
  { chave: "rua", rotulo: "Na rua ou em lugares públicos" },
  { chave: "outro", rotulo: "Outro lugar" },
];

export const INTENSIDADES = [
  { valor: 1, rotulo: "Leve" },
  { valor: 2, rotulo: "Moderado" },
  { valor: 3, rotulo: "Forte" },
];

export function rotuloDe(lista: Opcao[], chave: string): string {
  return (
    lista.find((o) => o.chave === chave)?.rotulo ??
    chave.charAt(0).toUpperCase() + chave.slice(1).replace(/_/g, " ")
  );
}

export function rotuloIntensidade(valor: number): string {
  return INTENSIDADES.find((i) => i.valor === valor)?.rotulo ?? "Moderado";
}

export type Checkin = {
  id: string;
  criado_em: string;
  humor: number;
  intensidade: number;
  motivos: string[];
  locais: string[];
  nota: string;
  privada?: boolean;
};

export type Contagem = { chave: string; rotulo: string; qtd: number; pct: number };
export type DiaResumo = { chave: string; media: number | null; qtd: number };

export type Resumo = {
  total: number;
  mediaHumor: number | null;
  diasComRegistro: number;
  dias: DiaResumo[];
  motivos: Contagem[];
  locais: Contagem[];
  motivosDificeis: Contagem[];
  qtdDificeis: number;
};

function contar(lista: Checkin[], campo: "motivos" | "locais", catalogo: Opcao[]): Contagem[] {
  const mapa = new Map<string, number>();
  for (const c of lista) {
    for (const k of new Set(c[campo])) mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([chave, qtd]) => ({
      chave,
      rotulo: rotuloDe(catalogo, chave),
      qtd,
      pct: lista.length ? Math.round((qtd / lista.length) * 100) : 0,
    }))
    .sort((a, b) => b.qtd - a.qtd || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

export function calcularResumo(checkins: Checkin[], agora: number, dias = 30): Resumo {
  const inicio = agora - dias * DIA_MS;
  const recentes = checkins.filter((c) => new Date(c.criado_em).getTime() >= inicio);

  const porDia = new Map<string, number[]>();
  for (const c of recentes) {
    const k = chaveDoDia(c.criado_em);
    porDia.set(k, [...(porDia.get(k) ?? []), c.humor]);
  }

  const serie: DiaResumo[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const chave = chaveDoDia(new Date(agora - i * DIA_MS));
    const valores = porDia.get(chave) ?? [];
    serie.push({
      chave,
      qtd: valores.length,
      media: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
    });
  }

  const dificeis = recentes.filter((c) => c.humor <= 2);

  return {
    total: recentes.length,
    mediaHumor: recentes.length ? recentes.reduce((a, c) => a + c.humor, 0) / recentes.length : null,
    diasComRegistro: serie.filter((d) => d.qtd > 0).length,
    dias: serie,
    motivos: contar(recentes, "motivos", MOTIVOS),
    locais: contar(recentes, "locais", LOCAIS),
    motivosDificeis: contar(dificeis, "motivos", MOTIVOS),
    qtdDificeis: dificeis.length,
  };
}