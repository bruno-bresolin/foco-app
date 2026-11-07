/**
 * Foco — timer Pomodoro em tela cheia: anel de progresso, sessões
 * vinculadas a tarefas, ciclos com pausa longa e durações ajustáveis.
 */

import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RingTimer } from '@/components/RingTimer';
import { Chip } from '@/components/ui';
import { useApp } from '@/context/app';
import { C, R, SP } from '@/constants/theme';
import { dayKey, todayKey } from '@/lib/dates';
import { focusMinutesOn } from '@/lib/stats';
import type { TimerMode } from '@/lib/types';

const MODE_THEME: Record<TimerMode, { label: string; from: string; to: string; pillBg: string; kind: 'foco' | 'pausa' }> = {
  foco: { label: 'Foco', from: '#A78BFA', to: '#6D28D9', pillBg: C.accentSoft, kind: 'foco' },
  pausa: { label: 'Pausa', from: '#6EE7B7', to: '#10B981', pillBg: C.greenSoft, kind: 'pausa' },
  pausaLonga: { label: 'Pausa longa', from: '#93C5FD', to: '#3B82F6', pillBg: C.blueSoft, kind: 'pausa' },
};

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FocoScreen() {
  useKeepAwake('foco-timer');
  const { width } = useWindowDimensions();
  const ringSize = Math.min(296, width - SP.xl * 2);
  const { data, timerNotice, startTimer, pauseTimer, skipTimer, resetTimer, setTimerTask, updateSettings } = useApp();
  const { timer, settings, tasks, sessions } = data;

  // tick local para exibição suave enquanto a sessão corre
  const [now, setNow] = useState(() => new Date().getTime());
  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setNow(new Date().getTime()), 250);
    return () => clearInterval(id);
  }, [timer.running]);

  const remaining = timer.running && timer.endsAt !== null ? Math.min(timer.remainingMs, Math.max(0, timer.endsAt - now)) : timer.remainingMs;
  const progress = timer.durationMs > 0 ? remaining / timer.durationMs : 0;
  const theme = MODE_THEME[timer.mode];

  const focusToday = useMemo(() => focusMinutesOn(sessions, todayKey()), [sessions]);
  const sessionsToday = useMemo(
    () => sessions.filter((s) => dayKey(new Date(s.endedAt)) === todayKey()).length,
    [sessions],
  );

  const selectableTasks = useMemo(() => {
    const today = todayKey();
    return tasks
      .filter((t) => !t.completed)
      .sort((a, b) => {
        const rank = (d: string | null) => (d === null ? 2 : d < today ? 0 : d === today ? 1 : 3);
        return rank(a.dueDate) - rank(b.dueDate);
      })
      .slice(0, 10);
  }, [tasks]);

  const linkedTask = timer.taskId ? tasks.find((t) => t.id === timer.taskId) : undefined;

  const adjustDuration = (delta: number) => {
    const next = Math.min(60, Math.max(15, settings.focusMin + delta));
    if (next !== settings.focusMin) updateSettings({ focusMin: next });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Ciclo atual */}
        <View style={styles.cycleRow}>
          <View style={styles.dots}>
            {Array.from({ length: settings.cyclesBeforeLong }).map((_, i) => (
              <View key={i} style={[styles.dot, i < timer.focusCount && styles.dotFilled]} />
            ))}
          </View>
          <Text style={styles.cycleText}>
            {timer.focusCount >= settings.cyclesBeforeLong
              ? 'Última do ciclo'
              : `Sessão ${Math.min(timer.focusCount + 1, settings.cyclesBeforeLong)} de ${settings.cyclesBeforeLong}`}
          </Text>
        </View>

        {/* Modo */}
        <View style={[styles.modePill, { backgroundColor: theme.pillBg }]}>
          <Text style={[styles.modeText, { color: theme.kind === 'foco' ? C.accentLight : theme.from }]}>
            {theme.label.toUpperCase()}
          </Text>
        </View>

        {/* Timer */}
        <RingTimer
          size={ringSize}
          strokeWidth={15}
          progress={progress}
          fromColor={theme.from}
          toColor={theme.to}
        >
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.clock}>{formatClock(remaining)}</Text>
          <Text style={styles.linked} numberOfLines={1}>
            {timer.mode === 'foco' ? linkedTask?.title ?? 'Foco livre' : 'Relaxe e respire'}
          </Text>
          <Text style={styles.sessionInfo}>
            {`${timer.mode === 'foco' ? 'sessão' : timer.mode === 'pausaLonga' ? 'pausa longa' : 'pausa'} de ${Math.round(timer.durationMs / 60_000)} min`}
          </Text>
        </RingTimer>

        {/* Controles */}
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Reiniciar timer" onPress={resetTimer} hitSlop={10} style={styles.controlSide}>
            <Ionicons name="refresh" size={24} color={C.textDim} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={timer.running ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
            onPress={timer.running ? pauseTimer : startTimer}
            style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name={timer.running ? 'pause' : 'play'} size={26} color="#FFFFFF" />
            <Text style={styles.playText}>{timer.running ? 'Pausar' : timer.startedAt !== null ? 'Continuar' : 'Iniciar'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Pular sessão" onPress={skipTimer} hitSlop={10} style={styles.controlSide}>
            <Ionicons name="play-skip-forward" size={24} color={C.textDim} />
          </Pressable>
        </View>

        {timerNotice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{timerNotice}</Text> : null}

        {/* Tarefa vinculada */}
        <View style={styles.taskSelector}>
          <Text style={styles.selectorTitle}>Focar em</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.taskChips}
          >
            <Chip
              label="Foco livre"
              selected={timer.taskId === null}
              onPress={() => setTimerTask(null)}
              textStyle={timer.taskId === null ? undefined : { color: C.textDim }}
            />
            {selectableTasks.map((t) => (
              <Chip
                key={t.id}
                label={t.title}
                selected={timer.taskId === t.id}
                onPress={() => setTimerTask(t.id)}
                textStyle={timer.taskId === t.id ? undefined : { color: C.textDim }}
                style={styles.taskChip}
              />
            ))}
          </ScrollView>
        </View>

        {/* Duração rápida (apenas foco ocioso) */}
        {timer.mode === 'foco' && !timer.running && timer.startedAt === null && (
          <View style={styles.durationRow}>
            <Pressable onPress={() => adjustDuration(-5)} hitSlop={10} style={styles.durationBtn}>
              <Ionicons name="remove" size={18} color={C.textDim} />
            </Pressable>
            <Text style={styles.durationText}>{settings.focusMin} min de foco</Text>
            <Pressable onPress={() => adjustDuration(5)} hitSlop={10} style={styles.durationBtn}>
              <Ionicons name="add" size={18} color={C.textDim} />
            </Pressable>
          </View>
        )}

        {/* Resumo do dia */}
        <View style={styles.todayRow}>
          <Ionicons name="time-outline" size={13} color={C.textFaint} />
          <Text style={styles.todayText}>
            Hoje: {sessionsToday} {sessionsToday === 1 ? 'sessão' : 'sessões'} · {focusToday} min de foco
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgDeep },
  container: { alignItems: 'center', padding: SP.xl, paddingTop: SP.l, paddingBottom: 130, gap: SP.l },

  cycleRow: { alignItems: 'center', gap: 7 },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.surface3 },
  dotFilled: { backgroundColor: C.accentLight },
  cycleText: { color: C.textFaint, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },

  modePill: { borderRadius: R.pill, paddingHorizontal: 16, paddingVertical: 6 },
  modeText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  clock: { color: C.text, fontSize: 58, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  linked: { color: C.textDim, fontSize: 13, fontWeight: '700', marginTop: 4, maxWidth: 190, textAlign: 'center' },
  sessionInfo: { color: C.textFaint, fontSize: 11, fontWeight: '600', marginTop: 3 },

  selectorTitle: {
    color: C.textFaint,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    alignSelf: 'flex-start',
    marginLeft: 2,
    marginBottom: SP.s,
  },
  taskChips: { gap: SP.s, paddingHorizontal: 2, paddingBottom: 2 },
  taskChip: { maxWidth: 200 },

  durationRow: { flexDirection: 'row', alignItems: 'center', gap: SP.m },
  durationBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: { color: C.textDim, fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: SP.m, marginTop: SP.xs },
  controlSide: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskSelector: { width: '100%', maxWidth: 600 },
  playText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  notice: { color: C.textDim, fontSize: 12, textAlign: 'center', maxWidth: 360 },
  playBtn: {
    flex: 1,
    maxWidth: 190,
    minHeight: 64,
    flexDirection: 'row',
    gap: SP.s,
    borderRadius: 25,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayText: { color: C.textFaint, fontSize: 12.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
