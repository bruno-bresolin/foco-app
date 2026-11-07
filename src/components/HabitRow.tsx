/**
 * Linha de hábito — marcação de hoje, streak (chama) e mini-histórico
 * dos últimos 7 dias.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryColor } from '@/constants/categories';
import { C, R, SP } from '@/constants/theme';
import { WEEKDAY_TINY, dayKey, todayKey } from '@/lib/dates';
import { currentStreak, isHabitDoneOn, isHabitScheduledOn } from '@/lib/stats';
import type { Habit } from '@/lib/types';

export function HabitRow({
  habit,
  onToggle,
  onOpen,
  days,
}: {
  habit: Habit;
  onToggle: () => void;
  onOpen: () => void;
  /** últimos 7 dias (terminando hoje) para o mini-histórico */
  days: Date[];
}) {
  const catColor = categoryColor(habit.categoryId);
  const today = todayKey();
  const doneToday = isHabitDoneOn(habit, today);
  const streak = currentStreak(habit);

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.surface2 }]}>
      <Pressable hitSlop={12} onPress={onToggle} style={styles.checkWrap}>
        <View style={[styles.check, doneToday && { backgroundColor: catColor, borderColor: catColor }]}>
          {doneToday && <Ionicons name="checkmark" size={16} color="#0B0B10" />}
        </View>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, doneToday && { color: C.textDim }]} numberOfLines={1}>
            {habit.title}
          </Text>
          {streak >= 2 && (
            <View style={styles.streak}>
              <Ionicons name="flame" size={12} color={C.orange} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>

        <View style={styles.week}>
          {days.map((d) => {
            const key = dayKey(d);
            const scheduled = isHabitScheduledOn(habit, d);
            const done = isHabitDoneOn(habit, key);
            const isToday = key === today;
            const state = done ? 'done' : scheduled ? (isToday ? 'pending' : 'missed') : 'off';
            return (
              <View key={key} style={styles.dayCol}>
                <View
                  style={[
                    styles.dot,
                    state === 'done' && { backgroundColor: catColor },
                    state === 'missed' && styles.dotMissed,
                    state === 'pending' && styles.dotPending,
                    state === 'off' && styles.dotOff,
                  ]}
                />
                <Text style={[styles.dayLabel, isToday && { color: C.text, fontWeight: '800' }]}>
                  {WEEKDAY_TINY[d.getDay()]}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.m,
    paddingVertical: 11,
    paddingHorizontal: SP.m,
    borderRadius: R.chip,
  },
  checkWrap: { padding: 4 },
  check: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 7 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SP.s },
  title: { color: C.text, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: C.orangeSoft,
    borderRadius: R.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  streakText: { color: C.orange, fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  week: { flexDirection: 'row', gap: 10 },
  dayCol: { alignItems: 'center', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  dotMissed: { backgroundColor: 'rgba(248,113,113,0.35)' },
  dotPending: { borderWidth: 1.5, borderColor: C.textDim },
  dotOff: { backgroundColor: C.surface3, width: 5, height: 5 },
  dayLabel: { color: C.textFaint, fontSize: 9, fontWeight: '600' },
});
