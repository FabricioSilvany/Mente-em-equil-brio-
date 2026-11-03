/* Regras de agenda. As horas de atendimento precisam ser iguais às da
   função agendar_consulta no banco (segunda a sexta, 08h às 17h). */

export const FUSO = "America/Bahia";
const OFFSET = "-03:00";

export const HORAS_ATENDIMENTO = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
export const DIAS_A_FRENTE = 14;
export const DURACAO_MIN = 50;
const ANTECEDENCIA_MS = 60 * 60 * 1000; // 1 hora
const DIA_MS = 24 * 60 * 60 * 1000;

export type Dia = {
  chave: string; // "2026-11-10"
  semana: string; // "ter."
  numero: string; // "10"
  mes: string; // "nov."
  slots: string[]; // horários em ISO com fuso, ex.: "2026-11-10T09:00:00-03:00"
};

export type Consulta = {
  id: string;
  inicio: string;
  duracao_min: number;
  status: "agendada" | "cancelada" | "concluida";
  papel: "paciente" | "profissional";
  outro_nome: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function hojeLocal(agora: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(agora);
  const pega = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { ano: pega("year"), mes: pega("month"), dia: pega("day") };
}

export function gerarDias(agora: Date = new Date()): Dia[] {
  const { ano, mes, dia } = hojeLocal(agora);
  const base = Date.UTC(ano, mes - 1, dia);
  const limite = agora.getTime() + ANTECEDENCIA_MS;
  const dias: Dia[] = [];

  for (let i = 0; i <= DIAS_A_FRENTE; i++) {
    const d = new Date(base + i * DIA_MS);
    const semanaIdx = d.getUTCDay();
    if (semanaIdx === 0 || semanaIdx === 6) continue; // sem fim de semana

    const chave = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const slots = HORAS_ATENDIMENTO.map((h) => `${chave}T${pad(h)}:00:00${OFFSET}`).filter(
      (iso) => new Date(iso).getTime() > limite,
    );
    if (slots.length === 0) continue;

    const ref = new Date(`${chave}T12:00:00${OFFSET}`);
    dias.push({
      chave,
      semana: new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: FUSO }).format(ref),
      numero: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", timeZone: FUSO }).format(ref),
      mes: new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: FUSO }).format(ref),
      slots,
    });
  }
  return dias;
}

/** Remove os horários ocupados e os dias que ficaram sem nenhum horário livre */
export function horariosLivres(dias: Dia[], ocupados: Set<number>): Dia[] {
  return dias
    .map((d) => ({
      ...d,
      slots: d.slots.filter((s) => !ocupados.has(new Date(s).getTime())),
    }))
    .filter((d) => d.slots.length > 0);
}

/** Intervalo (em UTC) que cobre todos os dias exibidos, para buscar horários ocupados */
export function intervaloBusca(dias: Dia[]) {
  if (dias.length === 0) {
    const agora = Date.now();
    return {
      de: new Date(agora).toISOString(),
      ate: new Date(agora + DIAS_A_FRENTE * DIA_MS).toISOString(),
    };
  }
  const primeiro = new Date(`${dias[0].chave}T00:00:00${OFFSET}`);
  const ultimo = new Date(`${dias[dias.length - 1].chave}T00:00:00${OFFSET}`);
  return {
    de: primeiro.toISOString(),
    ate: new Date(ultimo.getTime() + DIA_MS).toISOString(),
  };
}

/** O ISO dos horários já carrega a hora local (posições 11 e 12) */
export function periodoDoHorario(iso: string): "Manhã" | "Tarde" {
  return Number(iso.slice(11, 13)) < 12 ? "Manhã" : "Tarde";
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarData(iso: string): string {
  return capitalizar(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: FUSO,
    }).format(new Date(iso)),
  );
}

export function formatarDataHora(iso: string): string {
  return capitalizar(
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: FUSO,
    }).format(new Date(iso)),
  );
}

export function formatarHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: FUSO,
  }).format(new Date(iso));
}


export function chaveDoDia(quando: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(quando));
}