/**
 * Linha de tarefa — checkbox de conclusão, meta (categoria, prazo, foco)
 * e toque no corpo para editar.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoryColor, categoryLabel } from '@/constants/categories';
import { C, R, SP } from '@/constants/theme';
import { dueInfo } from '@/lib/dates';
import type { Task } from '@/lib/types';

const PRIORITY_COLOR: Record<Task['priority'], string> = {
  baixa: C.textFaint,
  media: C.orange,
  alta: C.red,
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export function TaskRow({ task, onToggle, onOpen }: { task: Task; onToggle: () => void; onOpen: () => void }) {
  const catColor = categoryColor(task.categoryId);
  const due = task.dueDate ? dueInfo(task.dueDate) : null;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.surface2 }]}
    >
      <Pressable hitSlop={12} onPress={onToggle} style={styles.checkboxWrap}>
        <View
          style={[
            styles.checkbox,
            task.completed && { backgroundColor: C.greenDeep, borderColor: C.greenDeep },
          ]}
        >
          {task.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.meta}>
          <View style={styles.cat}>
            <View style={[styles.catDot, { backgroundColor: catColor }]} />
            <Text style={styles.catText}>{categoryLabel(task.categoryId)}</Text>
          </View>
          {due && !task.completed && (
            <View style={[styles.dueChip, due.tone === 'overdue' && styles.dueOverdue, due.tone === 'today' && styles.dueToday]}>
              <Ionicons
                name={due.tone === 'overdue' ? 'alert' : 'calendar'}
                size={10}
                color={due.tone === 'overdue' ? C.red : due.tone === 'today' ? C.orange : C.textDim}
              />
              <Text style={[styles.dueText, due.tone === 'overdue' && { color: C.red }, due.tone === 'today' && { color: C.orange }]}>
                {due.label}
              </Text>
            </View>
          )}
          {task.priority !== 'media' && !task.completed && (
            <View style={styles.prio}>
              <Ionicons name="flag" size={10} color={PRIORITY_COLOR[task.priority]} />
              <Text style={[styles.prioText, { color: PRIORITY_COLOR[task.priority] }]}>
                {PRIORITY_LABEL[task.priority]}
              </Text>
            </View>
          )}
          {task.focusedMinutes > 0 && (
            <View style={styles.focusChip}>
              <Ionicons name="time" size={10} color={C.accentLight} />
              <Text style={styles.focusText}>
                {task.focusedMinutes} min
                {task.pomodoros > 0 ? ` · ${task.pomodoros}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={15} color={C.textFaint} />
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
  checkboxWrap: { padding: 4 },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 5 },
  title: { color: C.text, fontSize: 15, fontWeight: '700', lineHeight: 19 },
  titleDone: { color: C.textFaint, textDecorationLine: 'line-through', fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catText: { color: C.textDim, fontSize: 11, fontWeight: '600' },
  dueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.surface2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dueOverdue: { backgroundColor: C.redSoft },
  dueToday: { backgroundColor: C.orangeSoft },
  dueText: { color: C.textDim, fontSize: 10.5, fontWeight: '700' },
  prio: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prioText: { fontSize: 10.5, fontWeight: '700' },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  focusText: { color: C.accentLight, fontSize: 10.5, fontWeight: '700' },
});
