/**
 * Backup dos dados — exportar via compartilhamento, importar via seletor de arquivos.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { CATEGORIES } from '@/constants/categories';
import {
  AppData,
  AppSettings,
  DEFAULT_SETTINGS,
  FocusSession,
  Habit,
  IMPORT_LIMITS,
  Task,
  initialData,
} from './types';

interface BackupFile {
  app: 'foco';
  version: number;
  exportedAt: number;
  data: AppData;
}

const MIME_TYPES = ['application/json', 'application/octet-stream', 'text/plain'];

/** Exporta os dados como JSON e abre o painel de compartilhamento. */
export async function exportBackup(data: AppData): Promise<void> {
  const payload: BackupFile = {
    app: 'foco',
    version: data.version,
    exportedAt: Date.now(),
    data,
  };
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const file = new File(Paths.cache, `foco-backup-${stamp}.json`);
  await file.write(JSON.stringify(payload, null, 2));

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('O compartilhamento não está disponível nesta plataforma.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar backup do Foco',
  });
}

/** Abre o seletor de arquivos e devolve os dados do backup escolhido. */
export async function importBackup(): Promise<AppData> {
  const picked = await File.pickFileAsync({ mimeTypes: MIME_TYPES });
  if (picked.canceled || !picked.result) {
    throw new Error('Nenhum arquivo selecionado.');
  }
  const text = await picked.result.text();
  return parseBackup(text);
}

/** Valida e normaliza o conteúdo de um backup. Lança erros em português. */
export function parseBackup(text: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Arquivo inválido: não é um JSON legível.');
  }
  const root = parsed as Partial<BackupFile>;
  if (!root || root.app !== 'foco' || typeof root.data !== 'object' || root.data === null) {
    throw new Error('Arquivo inválido: não é um backup do Foco.');
  }
  return sanitizeData(root.data);
}

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

function isCategory(v: unknown): v is Task['categoryId'] {
  return typeof v === 'string' && CATEGORY_IDS.has(v as Task['categoryId']);
}

function sanitizeData(raw: Partial<AppData>): AppData {
  const base = initialData();
  const tasks = sanitizeArray<Partial<Task>>(raw.tasks, IMPORT_LIMITS.tasks);
  const habits = sanitizeArray<Partial<Habit>>(raw.habits, IMPORT_LIMITS.habits);
  const sessions = sanitizeArray<Partial<FocusSession>>(raw.sessions, IMPORT_LIMITS.sessions);

  const cleanTasks: Task[] = tasks.map((t, i) => ({
    id: typeof t?.id === 'string' && t.id ? t.id : `imp-t-${i}`,
    title: typeof t?.title === 'string' && t.title.trim() ? t.title.trim().slice(0, 200) : 'Tarefa sem título',
    notes: typeof t?.notes === 'string' ? t.notes.slice(0, 2000) : '',
    categoryId: isCategory(t?.categoryId) ? t.categoryId : 'pessoal',
    priority: t?.priority === 'baixa' || t?.priority === 'media' || t?.priority === 'alta' ? t.priority : 'media',
    dueDate: typeof t?.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : null,
    completed: t?.completed === true,
    completedAt: typeof t?.completedAt === 'number' ? t.completedAt : null,
    focusedMinutes: clampInt(t?.focusedMinutes, 0, 1_000_000, 0),
    pomodoros: clampInt(t?.pomodoros, 0, 100_000, 0),
    createdAt: typeof t?.createdAt === 'number' ? t.createdAt : Date.now(),
  }));

  const cleanHabits: Habit[] = habits.map((h, i) => {
    const history = Array.isArray(h?.history)
      ? h.history.filter((k): k is string => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k)).sort()
      : [];
    return {
      id: typeof h?.id === 'string' && h.id ? h.id : `imp-h-${i}`,
      title: typeof h?.title === 'string' && h.title.trim() ? h.title.trim().slice(0, 200) : 'Hábito sem título',
      categoryId: isCategory(h?.categoryId) ? h.categoryId : 'pessoal',
      days: Array.isArray(h?.days)
        ? [...new Set(h.days.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6))].sort((a, b) => a - b)
        : [0, 1, 2, 3, 4, 5, 6],
      history: [...new Set(history)],
      createdAt: typeof h?.createdAt === 'number' ? h.createdAt : Date.now(),
    };
  });

  const cleanSessions: FocusSession[] = sessions.map((s, i) => ({
    id: typeof s?.id === 'string' && s.id ? s.id : `imp-s-${i}`,
    taskId: typeof s?.taskId === 'string' ? s.taskId : null,
    taskTitle: typeof s?.taskTitle === 'string' ? s.taskTitle.slice(0, 200) : null,
    minutes: clampInt(s?.minutes, 0, 600, 0),
    endedAt: typeof s?.endedAt === 'number' ? s.endedAt : Date.now(),
  }));

  const s: Partial<AppSettings> = raw.settings ?? {};
  const cleanSettings: AppSettings = {
    focusMin: clampInt(s.focusMin, 15, 60, DEFAULT_SETTINGS.focusMin),
    breakMin: clampInt(s.breakMin, 3, 15, DEFAULT_SETTINGS.breakMin),
    longBreakMin: clampInt(s.longBreakMin, 10, 30, DEFAULT_SETTINGS.longBreakMin),
    cyclesBeforeLong: clampInt(s.cyclesBeforeLong, 2, 6, DEFAULT_SETTINGS.cyclesBeforeLong),
    autoStartNext: typeof s.autoStartNext === 'boolean' ? s.autoStartNext : DEFAULT_SETTINGS.autoStartNext,
    haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
  };

  if (cleanTasks.length === 0 && cleanHabits.length === 0 && cleanSessions.length === 0) {
    throw new Error('O backup não contém nenhuma tarefa, hábito ou sessão.');
  }

  return {
    version: 1,
    tasks: cleanTasks,
    habits: cleanHabits,
    sessions: cleanSessions,
    settings: cleanSettings,
    timer: base.timer,
  };
}

function sanitizeArray<T>(v: unknown, limit: number): T[] {
  if (!Array.isArray(v)) throw new Error('Backup com estrutura inesperada.');
  if (v.length > limit) throw new Error(`Backup grande demais (limite de ${limit} itens por lista).`);
  return v as T[];
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
}
