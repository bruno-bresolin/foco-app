/**
 * Contexto global: dados (tarefas, hábitos, sessões, ajustes), persistência
 * em AsyncStorage e a máquina de estados do timer Pomodoro.
 *
 * O timer é baseado em relógio de parede (endsAt), então continua contando
 * com o app em segundo plano e sobrevive a reinícios do app.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AppState } from 'react-native';

import { prepareTimerNotifications, syncTimerNotification } from '@/lib/timerNotifications';
import { idleTimer, completeCurrentSession, reconcileTimer, startTimerState, pauseTimerState } from '@/lib/timer';

import {
  AppData,
  AppSettings,
  DATA_VERSION,
  DEFAULT_SETTINGS,
  Habit,
  HabitInput,
  Task,
  TaskInput,
  initialData,
  uid,
} from '@/lib/types';
import { dayKey } from '@/lib/dates';

const STORAGE_KEY = '@foco/app-data';

SplashScreen.preventAutoHideAsync().catch(() => {});

/* ------------------------------------------------------------------ */
/* Normalização dos dados persistidos                                 */
/* ------------------------------------------------------------------ */

function normalizeStored(raw: unknown): AppData {
  const base = initialData();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppData>;
  const s = { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) };
  const clamp = (v: number, lo: number, hi: number, fb: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fb;
  s.focusMin = clamp(s.focusMin, 15, 60, DEFAULT_SETTINGS.focusMin);
  s.breakMin = clamp(s.breakMin, 3, 15, DEFAULT_SETTINGS.breakMin);
  s.longBreakMin = clamp(s.longBreakMin, 10, 30, DEFAULT_SETTINGS.longBreakMin);
  s.cyclesBeforeLong = clamp(s.cyclesBeforeLong, 2, 6, DEFAULT_SETTINGS.cyclesBeforeLong);
  s.autoStartNext = typeof s.autoStartNext === 'boolean' ? s.autoStartNext : DEFAULT_SETTINGS.autoStartNext;
  s.haptics = typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics;
  return {
    version: DATA_VERSION,
    tasks: Array.isArray(r.tasks) ? r.tasks : [],
    habits: Array.isArray(r.habits) ? r.habits : [],
    sessions: Array.isArray(r.sessions) ? r.sessions : [],
    settings: s,
    timer: { ...base.timer, ...(r.timer ?? {}) },
  };
}

/* ------------------------------------------------------------------ */
/* Contexto                                                            */
/* ------------------------------------------------------------------ */

export interface AppContextValue {
  loaded: boolean;
  timerNotice: string | null;
  data: AppData;

  addTask: (input: TaskInput) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addHabit: (input: HabitInput) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  toggleHabitToday: (id: string) => void;
  deleteHabit: (id: string) => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;

  startTimer: () => void;
  pauseTimer: () => void;
  skipTimer: () => void;
  resetTimer: () => void;
  setTimerTask: (taskId: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [notificationRevision, setNotificationRevision] = useState(0);
  const [timerNotice, setTimerNotice] = useState<string | null>(null);

  const settingsRef = useRef(data.settings);
  useEffect(() => {
    settingsRef.current = data.settings;
  }, [data.settings]);

  /* ---------------- carregamento ---------------- */

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        if (raw) {
          try {
            const parsed = normalizeStored(JSON.parse(raw));
            setData(reconcileTimer(parsed, Date.now()));
          } catch {
            setData(initialData());
          }
        }
        setLoaded(true);
      })
      .catch(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  /* ---------------- persistência ---------------- */

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [data, loaded]);

  /* ---------------- haptics ---------------- */

  const buzz = useCallback(async (kind: 'light' | 'success' | 'medium') => {
    if (!settingsRef.current.haptics) return;
    try {
      if (kind === 'light') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (kind === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // plataforma sem haptics
    }
  }, []);

  /* Reconcile by wall clock, including time spent with JavaScript suspended. */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setData((prev) => reconcileTimer(prev, Date.now()));
        setNotificationRevision((revision) => revision + 1);
      }
    });
    return () => subscription.remove();
  }, []);

  const { running, endsAt } = data.timer;
  useEffect(() => {
    if (!running || endsAt === null) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (now >= endsAt) {
        buzz('success');
        setData((prev) => reconcileTimer(prev, now));
      }
    }, 500);
    return () => clearInterval(id);
  }, [running, endsAt, buzz]);

  const timerTaskTitle = data.tasks.find((task) => task.id === data.timer.taskId)?.title ?? 'Foco livre';
  useEffect(() => {
    if (!loaded) return;
    let active = true;
    syncTimerNotification(data.timer, data.settings, timerTaskTitle).catch(() => {
      if (active) setTimerNotice('Não foi possível ativar a notificação. Pause e inicie novamente para tentar.');
    });
    return () => { active = false; };
  }, [loaded, data.timer, data.settings, timerTaskTitle, notificationRevision]);

  /* ---------------- ações: tarefas ---------------- */

  const addTask = useCallback((input: TaskInput) => {
    setData((prev) => ({
      ...prev,
      tasks: [
        {
          ...input,
          id: uid(),
          completed: false,
          completedAt: null,
          focusedMinutes: 0,
          pomodoros: 0,
          createdAt: Date.now(),
        },
        ...prev.tasks,
      ],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch, id: t.id } : t)),
    }));
  }, []);

  const toggleTask = useCallback(
    (id: string) => {
      buzz('light');
      const now = Date.now();
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? now : null } : t,
        ),
      }));
    },
    [buzz],
  );

  const deleteTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      timer: prev.timer.taskId === id ? { ...prev.timer, taskId: null } : prev.timer,
    }));
  }, []);

  /* ---------------- ações: hábitos ---------------- */

  const addHabit = useCallback((input: HabitInput) => {
    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, { ...input, id: uid(), history: [], createdAt: Date.now() }],
    }));
  }, []);

  const updateHabit = useCallback((id: string, patch: Partial<Habit>) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...patch, id: h.id } : h)),
    }));
  }, []);

  const toggleHabitToday = useCallback(
    (id: string) => {
      buzz('light');
      const key = dayKey(new Date());
      setData((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== id) return h;
          const has = h.history.includes(key);
          const history = has ? h.history.filter((k) => k !== key) : [...h.history, key].sort();
          return { ...h, history };
        }),
      }));
    },
    [buzz],
  );

  const deleteHabit = useCallback((id: string) => {
    setData((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  /* ---------------- ações: ajustes e dados ---------------- */

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((prev) => {
      const settings = { ...prev.settings, ...patch };
      const t = prev.timer;
      // sincroniza a sessão ociosa de foco com a nova duração
      const idleUntouched = !t.running && t.mode === 'foco' && t.remainingMs === t.durationMs;
      const timer = idleUntouched
        ? { ...t, durationMs: settings.focusMin * 60_000, remainingMs: settings.focusMin * 60_000 }
        : t;
      return { ...prev, settings, timer };
    });
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData({ ...next, timer: idleTimer(next.settings) });
  }, []);

  const resetAll = useCallback(() => {
    setData(initialData());
  }, []);

  /* ---------------- ações: timer ---------------- */

  const startTimer = useCallback(async () => {
    const notice = await prepareTimerNotifications();
    setTimerNotice(notice);
    buzz('light');
    setData((prev) => startTimerState(prev, Date.now()));
  }, [buzz]);

  const pauseTimer = useCallback(() => {
    buzz('light');
    setData((prev) => pauseTimerState(prev, Date.now()));
  }, [buzz]);

  const skipTimer = useCallback(() => {
    buzz('medium');
    setData((prev) => {
      const t = prev.timer;
      if (!t.running && t.startedAt === null) {
        // ocioso: apenas alterna o modo (foco <-> pausa)
        if (t.mode === 'foco') {
          const durationMs = prev.settings.breakMin * 60_000;
          return { ...prev, timer: { ...t, mode: 'pausa', durationMs, remainingMs: durationMs } };
        }
        const durationMs = prev.settings.focusMin * 60_000;
        return { ...prev, timer: { ...t, mode: 'foco', durationMs, remainingMs: durationMs } };
      }
      return completeCurrentSession(prev, Date.now(), { full: false });
    });
  }, [buzz]);

  const resetTimer = useCallback(() => {
    buzz('light');
    setData((prev) => {
      const t = prev.timer;
      const durationMs = prev.settings.focusMin * 60_000;
      return {
        ...prev,
        timer: { ...t, mode: 'foco', running: false, endsAt: null, durationMs, remainingMs: durationMs, startedAt: null },
      };
    });
  }, [buzz]);

  const setTimerTask = useCallback((taskId: string | null) => {
    setData((prev) => ({ ...prev, timer: { ...prev.timer, taskId } }));
  }, []);

  /* ---------------- valor do contexto ---------------- */

  const value = useMemo<AppContextValue>(() => {
    return {
      loaded,
      timerNotice,
      data,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addHabit,
      updateHabit,
      toggleHabitToday,
      deleteHabit,
      updateSettings,
      replaceAll,
      resetAll,
      startTimer,
      pauseTimer,
      skipTimer,
      resetTimer,
      setTimerTask,
    };
  }, [data, loaded, timerNotice, addTask, updateTask, toggleTask, deleteTask, addHabit, updateHabit, toggleHabitToday, deleteHabit, updateSettings, replaceAll, resetAll, startTimer, pauseTimer, skipTimer, resetTimer, setTimerTask]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
