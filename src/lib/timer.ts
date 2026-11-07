import { uid } from './types';
import type { AppData, AppSettings, FocusSession, Task, TimerMode, TimerState } from './types';

export function idleTimer(settings: AppSettings): TimerState {
  const durationMs = settings.focusMin * 60_000;
  return {
    mode: 'foco',
    running: false,
    endsAt: null,
    remainingMs: durationMs,
    durationMs,
    focusCount: 0,
    taskId: null,
    startedAt: null,
  };
}

interface CompleteOpts {
  /** true = sessão venceu naturalmente; false = usuário pulou */
  full: boolean;
}

/**
 * Registra a sessão atual (se couver) e avança para o próximo modo.
 * Função pura: devolve o novo AppData.
 */
export function completeCurrentSession(data: AppData, now: number, opts: CompleteOpts): AppData {
  const { timer, settings } = data;
  let sessions: FocusSession[] = data.sessions;
  let tasks: Task[] = data.tasks;
  let focusCount = timer.focusCount;

  const startedAt = timer.startedAt ?? now - timer.durationMs;
  const elapsedMin = Math.max(0, Math.round((now - startedAt) / 60_000));

  if (timer.mode === 'foco' && (opts.full || elapsedMin >= 1)) {
    const minutes = opts.full ? Math.round(timer.durationMs / 60_000) : elapsedMin;
    const task = timer.taskId ? tasks.find((t) => t.id === timer.taskId) : undefined;
    sessions = [
      ...sessions,
      {
        id: uid(),
        taskId: timer.taskId,
        taskTitle: task?.title ?? null,
        minutes,
        endedAt: now,
      },
    ];
    if (task) {
      tasks = tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              focusedMinutes: t.focusedMinutes + minutes,
              pomodoros: t.pomodoros + (opts.full ? 1 : 0),
            }
          : t,
      );
    }
    if (opts.full) focusCount = timer.focusCount + 1;
  }

  let mode: TimerMode;
  let durationMs: number;
  if (timer.mode === 'foco') {
    const goLong = opts.full && focusCount >= settings.cyclesBeforeLong;
    mode = goLong ? 'pausaLonga' : 'pausa';
    durationMs = (goLong ? settings.longBreakMin : settings.breakMin) * 60_000;
  } else {
    mode = 'foco';
    durationMs = settings.focusMin * 60_000;
    if (timer.mode === 'pausaLonga') focusCount = 0;
  }

  const nextTimer: TimerState = {
    mode,
    running: settings.autoStartNext,
    endsAt: settings.autoStartNext ? now + durationMs : null,
    remainingMs: durationMs,
    durationMs,
    focusCount,
    taskId: timer.taskId,
    startedAt: settings.autoStartNext ? now : null,
  };

  return { ...data, sessions, tasks, timer: nextTimer };
}

/** Ajusta timers vencidos enquanto o app estava fechado. */
export function reconcileTimer(data: AppData, now: number): AppData {
  const t = data.timer;
  if (!t.running || t.endsAt === null || t.endsAt > now) return data;
  if (now - t.endsAt > 24 * 3_600_000) {
    return { ...data, timer: idleTimer(data.settings) };
  }
  let out = data;
  while (out.timer.running && out.timer.endsAt !== null && out.timer.endsAt <= now) {
    out = completeCurrentSession(out, out.timer.endsAt, { full: true });
  }
  return out;
}


export function startTimerState(data: AppData, now: number): AppData {
  if (data.timer.running) return reconcileTimer(data, now);
  const timer = data.timer;
  return {
    ...data,
    timer: {
      ...timer,
      running: true,
      endsAt: now + timer.remainingMs,
      startedAt: timer.startedAt ?? now,
    },
  };
}

export function pauseTimerState(data: AppData, now: number): AppData {
  const reconciled = reconcileTimer(data, now);
  const timer = reconciled.timer;
  if (!timer.running || timer.endsAt === null) return reconciled;
  return {
    ...reconciled,
    timer: { ...timer, running: false, endsAt: null, remainingMs: Math.max(0, timer.endsAt - now) },
  };
}
