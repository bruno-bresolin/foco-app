/**
 * Modelo de dados do Foco.
 */

import type { CategoryId } from '@/constants/categories';

export type Priority = 'baixa' | 'media' | 'alta';
export type TimerMode = 'foco' | 'pausa' | 'pausaLonga';

export interface Task {
  id: string;
  title: string;
  notes: string;
  categoryId: CategoryId;
  priority: Priority;
  /** 'YYYY-MM-DD' local, ou null quando sem data */
  dueDate: string | null;
  completed: boolean;
  /** epoch ms do momento de conclusão */
  completedAt: number | null;
  /** minutos de foco acumulados via Pomodoro */
  focusedMinutes: number;
  /** sessões de foco concluídas */
  pomodoros: number;
  createdAt: number;
}

export interface Habit {
  id: string;
  title: string;
  categoryId: CategoryId;
  /** dias da semana em que o hábito é praticado — 0 (dom) a 6 (sáb) */
  days: number[];
  /** lista crescente de chaves 'YYYY-MM-DD' concluídas */
  history: string[];
  createdAt: number;
}

/** Uma sessão de foco concluída (total ou parcial). */
export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  minutes: number;
  /** epoch ms de término */
  endedAt: number;
}

export interface AppSettings {
  /** duração do foco em minutos (15–60) */
  focusMin: number;
  /** pausa curta em minutos (3–15) */
  breakMin: number;
  /** pausa longa em minutos (10–30) */
  longBreakMin: number;
  /** sessões de foco antes da pausa longa (2–6) */
  cyclesBeforeLong: number;
  /** inicia a próxima sessão automaticamente */
  autoStartNext: boolean;
  /** vibração/hápticos */
  haptics: boolean;
}

export interface TimerState {
  mode: TimerMode;
  running: boolean;
  /** epoch ms do fim da sessão enquanto estiver rodando */
  endsAt: number | null;
  /** ms restantes quando pausado; ms totais quando ocioso */
  remainingMs: number;
  /** duração total da sessão atual (ms) */
  durationMs: number;
  /** sessões de foco concluídas desde a última pausa longa */
  focusCount: number;
  /** tarefa vinculada à sessão atual (null = foco livre) */
  taskId: string | null;
  /** epoch ms de quando a sessão começou a correr */
  startedAt: number | null;
}

export interface AppData {
  version: number;
  tasks: Task[];
  habits: Habit[];
  sessions: FocusSession[];
  settings: AppSettings;
  timer: TimerState;
}

export const DATA_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLong: 4,
  autoStartNext: true,
  haptics: true,
};

export const SETTINGS_BOUNDS = {
  focusMin: { min: 15, max: 60, step: 5 },
  breakMin: { min: 3, max: 15, step: 1 },
  longBreakMin: { min: 10, max: 30, step: 5 },
  cyclesBeforeLong: { min: 2, max: 6, step: 1 },
} as const;

/** Limites de plausibilidade para dados importados. */
export const IMPORT_LIMITS = {
  tasks: 5000,
  habits: 500,
  sessions: 50000,
} as const;

export function initialData(): AppData {
  return {
    version: DATA_VERSION,
    tasks: [],
    habits: [],
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
    timer: {
      mode: 'foco',
      running: false,
      endsAt: null,
      remainingMs: DEFAULT_SETTINGS.focusMin * 60_000,
      durationMs: DEFAULT_SETTINGS.focusMin * 60_000,
      focusCount: 0,
      taskId: null,
      startedAt: null,
    },
  };
}

export type TaskInput = Omit<Task, 'id' | 'completed' | 'completedAt' | 'focusedMinutes' | 'pomodoros' | 'createdAt'>;

export type HabitInput = Omit<Habit, 'id' | 'history' | 'createdAt'>;

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
