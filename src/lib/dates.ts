/**
 * Utilidades de data — tudo em horário local, chaves 'YYYY-MM-DD'.
 * Sem Intl para garantir compatibilidade com todos os runtimes.
 */

export const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const WEEKDAY_TINY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

export const WEEKDAY_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
] as const;

export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'] as const;

/** Chave local 'YYYY-MM-DD' de uma data. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function todayKey(): string {
  return dayKey(new Date());
}

/** Converte 'YYYY-MM-DD' em Date local (meio-dia, à prova de DST). */
export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Diferença em dias entre duas chaves (b - a). */
export function diffDays(keyA: string, keyB: string): number {
  const a = fromKey(keyA).getTime();
  const b = fromKey(keyB).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Últimos n dias, terminando hoje. */
export function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(new Date(), -i));
  return out;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Boa madrugada';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** 'sexta-feira, 7 de novembro' */
export function longDateLabel(d: Date): string {
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} de ${MONTH_SHORT[d.getMonth()]}`;
}

/** '7 de nov' */
export function shortDateLabel(d: Date): string {
  return `${d.getDate()} de ${MONTH_SHORT[d.getMonth()]}`;
}

export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'later';

export interface DueInfo {
  label: string;
  tone: DueTone;
}

/** Rótulo de vencimento relativo ao hoje. */
export function dueInfo(dueDate: string): DueInfo {
  const today = todayKey();
  const diff = diffDays(today, dueDate);
  if (diff < 0) {
    return { label: diff === -1 ? 'Atrasada 1 dia' : `Atrasada ${-diff} dias`, tone: 'overdue' };
  }
  if (diff === 0) return { label: 'Hoje', tone: 'today' };
  if (diff === 1) return { label: 'Amanhã', tone: 'tomorrow' };
  return { label: shortDateLabel(fromKey(dueDate)), tone: 'later' };
}

/** '07/11 14:32' para backups e carimbos. */
export function stampLabel(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
