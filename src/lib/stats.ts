/**
 * Cálculos de estatísticas: dia a dia, sequências (streaks) e agregados.
 */

import type { AppData, FocusSession, Habit, Task } from './types';
import { addDays, dayKey, fromKey, lastNDays, todayKey } from './dates';

export interface DayStats {
  key: string;
  date: Date;
  focusMin: number;
  tasksDone: number;
  habitsDone: number;
  habitsScheduled: number;
}

export function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  return habit.days.includes(date.getDay());
}

export function isHabitDoneOn(habit: Habit, key: string): boolean {
  return habit.history.includes(key);
}

/** Minutos de foco registrados exatamente em uma chave de dia. */
export function focusMinutesOn(sessions: FocusSession[], key: string): number {
  const dayStart = fromKey(key);
  const start = new Date(dayStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dayStart);
  end.setHours(23, 59, 59, 999);
  return sessions.reduce((acc, s) => {
    if (s.endedAt >= start.getTime() && s.endedAt <= end.getTime()) return acc + s.minutes;
    return acc;
  }, 0);
}

/** Tarefas concluídas (completedAt) em uma chave de dia. */
export function tasksCompletedOn(tasks: Task[], key: string): number {
  const dayStart = fromKey(key);
  const start = new Date(dayStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dayStart);
  end.setHours(23, 59, 59, 999);
  return tasks.filter(
    (t) => t.completed && t.completedAt !== null && t.completedAt >= start.getTime() && t.completedAt <= end.getTime(),
  ).length;
}

export function habitsOnDate(habits: Habit[], date: Date): { done: number; scheduled: number } {
  const key = dayKey(date);
  let done = 0;
  let scheduled = 0;
  for (const h of habits) {
    if (!isHabitScheduledOn(h, date)) continue;
    scheduled++;
    if (isHabitDoneOn(h, key)) done++;
  }
  return { done, scheduled };
}

/** Estatísticas dos últimos 7 dias (terminando hoje). */
export function weekStats(data: AppData): DayStats[] {
  return lastNDays(7).map((date) => {
    const key = dayKey(date);
    const habits = habitsOnDate(data.habits, date);
    return {
      key,
      date,
      focusMin: focusMinutesOn(data.sessions, key),
      tasksDone: tasksCompletedOn(data.tasks, key),
      habitsDone: habits.done,
      habitsScheduled: habits.scheduled,
    };
  });
}

/**
 * Sequência atual de um hábito: dias agendados e concluídos, consecutivos,
 * terminando hoje. Hoje pendente não quebra a sequência.
 */
export function currentStreak(habit: Habit): number {
  let streak = 0;
  let d = new Date();
  const created = fromKey(dayKey(new Date(habit.createdAt)));
  const todayScheduled = isHabitScheduledOn(habit, d);
  if (todayScheduled && !isHabitDoneOn(habit, dayKey(d))) {
    d = addDays(d, -1); // hoje ainda dá tempo
  }
  let guard = 0;
  while (guard++ < 3660) {
    if (d < created) break;
    if (isHabitScheduledOn(habit, d)) {
      if (isHabitDoneOn(habit, dayKey(d))) {
        streak++;
        d = addDays(d, -1);
      } else {
        break;
      }
    } else {
      d = addDays(d, -1);
    }
  }
  return streak;
}

/** Melhor sequência histórica do hábito. */
export function bestStreak(habit: Habit): number {
  if (habit.history.length === 0) return 0;
  const created = fromKey(dayKey(new Date(habit.createdAt)));
  const doneSet = new Set(habit.history);
  let best = 0;
  let run = 0;
  const today = new Date();
  let d = new Date(created);
  let guard = 0;
  while (d <= today && guard++ < 3660) {
    if (isHabitScheduledOn(habit, d)) {
      if (doneSet.has(dayKey(d))) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    d = addDays(d, 1);
  }
  return best;
}

export interface WeekSummary {
  focusMin: number;
  sessions: number;
  tasksDone: number;
  habitsDone: number;
  habitsScheduled: number;
  habitRate: number | null;
  bestCurrentStreak: number;
  focusAvgPerDay: number;
}

export function weekSummary(data: AppData): WeekSummary {
  const days = weekStats(data);
  const focusMin = days.reduce((a, d) => a + d.focusMin, 0);
  const tasksDone = days.reduce((a, d) => a + d.tasksDone, 0);
  const habitsDone = days.reduce((a, d) => a + d.habitsDone, 0);
  const habitsScheduled = days.reduce((a, d) => a + d.habitsScheduled, 0);
  const sessions = data.sessions.filter((s) => s.endedAt >= fromKey(dayKey(days[0].date)).getTime()).length;
  const bestCurrentStreak = data.habits.reduce((acc, h) => Math.max(acc, currentStreak(h)), 0);
  return {
    focusMin,
    sessions,
    tasksDone,
    habitsDone,
    habitsScheduled,
    habitRate: habitsScheduled > 0 ? Math.round((habitsDone / habitsScheduled) * 100) : null,
    bestCurrentStreak,
    focusAvgPerDay: Math.round(focusMin / 7),
  };
}

/** Tarefas visíveis na Home, agrupadas por situação. */
export interface TaskGroups {
  overdue: Task[];
  today: Task[];
  undated: Task[];
  upcoming: Task[];
  doneToday: Task[];
}

export function groupTasks(tasks: Task[]): TaskGroups {
  const today = todayKey();
  const active = tasks.filter((t) => !t.completed);
  const startToday = fromKey(today);
  startToday.setHours(0, 0, 0, 0);
  const endToday = fromKey(today);
  endToday.setHours(23, 59, 59, 999);
  const byDue = (a: Task, b: Task) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999');
  return {
    overdue: active.filter((t) => t.dueDate !== null && t.dueDate < today).sort(byDue),
    today: active.filter((t) => t.dueDate === today).sort(byDue),
    undated: active.filter((t) => t.dueDate === null),
    upcoming: active.filter((t) => t.dueDate !== null && t.dueDate > today).sort(byDue),
    doneToday: tasks
      .filter((t) => t.completed && t.completedAt !== null && t.completedAt >= startToday.getTime() && t.completedAt <= endToday.getTime())
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
  };
}
