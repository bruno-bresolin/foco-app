/**
 * Home — painel unificado do dia: progresso, tarefas e hábitos.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HabitModal } from '@/components/HabitModal';
import { HabitRow } from '@/components/HabitRow';
import { TaskModal } from '@/components/TaskModal';
import { TaskRow } from '@/components/TaskRow';
import { ChooserSheet, EmptyState, Fab, SectionHeader, Screen } from '@/components/ui';
import { useApp } from '@/context/app';
import { C, R, SP, softShadow } from '@/constants/theme';
import { greeting, lastNDays, longDateLabel, todayKey } from '@/lib/dates';
import { focusMinutesOn, groupTasks, isHabitScheduledOn } from '@/lib/stats';
import type { Habit, Task, TaskInput, HabitInput } from '@/lib/types';

export default function HomeScreen() {
  const { data, addTask, updateTask, toggleTask, deleteTask, addHabit, updateHabit, toggleHabitToday, deleteHabit } = useApp();

  const [chooserVisible, setChooserVisible] = useState(false);
  const [taskModal, setTaskModal] = useState<{ visible: boolean; task: Task | null }>({ visible: false, task: null });
  const [habitModal, setHabitModal] = useState<{ visible: boolean; habit: Habit | null }>({ visible: false, habit: null });
  const [showDone, setShowDone] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);

  const today = todayKey();
  const weekDays = useMemo(() => lastNDays(7), []);

  const groups = useMemo(() => groupTasks(data.tasks), [data.tasks]);
  const todayHabits = useMemo(
    () => data.habits.filter((h) => isHabitScheduledOn(h, new Date())),
    [data.habits],
  );
  const focusToday = useMemo(() => focusMinutesOn(data.sessions, today), [data.sessions, today]);

  const tasksActive = groups.overdue.length + groups.today.length + groups.undated.length;
  const tasksDone = groups.doneToday.length;
  const tasksDayTotal = tasksActive + tasksDone;
  const habitsTotal = todayHabits.length;
  const habitsDone = todayHabits.filter((h) => h.history.includes(today)).length;
  const denominator = tasksDayTotal + habitsTotal;
  const numerator = tasksDone + habitsDone;
  const progress = denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  const openNewTask = () => setTaskModal({ visible: true, task: null });
  const openNewHabit = () => setHabitModal({ visible: true, habit: null });

  const renderTasks = (list: Task[]) =>
    list.map((t) => (
      <TaskRow
        key={t.id}
        task={t}
        onToggle={() => toggleTask(t.id)}
        onOpen={() => setTaskModal({ visible: true, task: t })}
      />
    ));

  return (
    <Screen floatingAction={<Fab onPress={() => setChooserVisible(true)} />}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.dateLabel}>{longDateLabel(new Date())}</Text>
        </View>
        <Pressable onPress={() => router.push('/ajustes')} hitSlop={10} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={20} color={C.textDim} />
        </Pressable>
      </View>

      {/* Cartão de progresso */}
      <LinearGradient
        colors={[C.accentDeep, C.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroLabel}>Progresso de hoje</Text>
            <View style={styles.heroNumbers}>
              <Text style={styles.heroPct}>{progress}%</Text>
              {denominator > 0 ? (
                <Text style={styles.heroOf}>
                  {numerator} de {denominator} itens
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/foco')}
            style={({ pressed }) => [styles.heroFocusBtn, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.heroFocusText}>Focar</Text>
          </Pressable>
        </View>

        <View style={styles.heroBarTrack}>
          <View style={[styles.heroBarFill, { width: `${Math.max(progress, 4)}%` }]} />
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Ionicons name="checkmark-done" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroStatText}>
              {tasksDone}/{tasksDayTotal} tarefas
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Ionicons name="repeat" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroStatText}>
              {habitsDone}/{habitsTotal} hábitos
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Ionicons name="time" size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroStatText}>{focusToday} min de foco</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tarefas */}
      <SectionHeader title="Tarefas" count={tasksDayTotal} onAdd={openNewTask} />

      {tasksDayTotal === 0 && groups.upcoming.length === 0 ? (
        <EmptyState
          icon="checkbox-outline"
          title="Nenhuma tarefa por aqui"
          subtitle="Crie sua primeira tarefa e organize o seu dia."
          actionLabel="Nova tarefa"
          onAction={openNewTask}
        />
      ) : (
        <View style={styles.listCard}>
          {groups.overdue.length > 0 && (
            <View style={styles.subgroup}>
              <Text style={styles.subgroupTitle}>Atrasadas</Text>
              {renderTasks(groups.overdue)}
            </View>
          )}
          {groups.today.length > 0 && (
            <View style={styles.subgroup}>
              {groups.overdue.length > 0 ? <Text style={styles.subgroupTitle}>Hoje</Text> : null}
              {renderTasks(groups.today)}
            </View>
          )}
          {groups.undated.length > 0 && (
            <View style={styles.subgroup}>
              {groups.overdue.length + groups.today.length > 0 ? <Text style={styles.subgroupTitle}>Sem data</Text> : null}
              {renderTasks(groups.undated)}
            </View>
          )}

          {groups.upcoming.length > 0 && (
            <Pressable onPress={() => setShowUpcoming((v) => !v)} style={styles.collapsibleHeader}>
              <Text style={styles.collapsibleTitle}>Próximas ({groups.upcoming.length})</Text>
              <Ionicons name={showUpcoming ? 'chevron-up' : 'chevron-down'} size={15} color={C.textFaint} />
            </Pressable>
          )}
          {showUpcoming && <View style={styles.subgroup}>{renderTasks(groups.upcoming)}</View>}

          {groups.doneToday.length > 0 && (
            <Pressable onPress={() => setShowDone((v) => !v)} style={styles.collapsibleHeader}>
              <Text style={[styles.collapsibleTitle, { color: C.green }]}>Concluídas hoje ({groups.doneToday.length})</Text>
              <Ionicons name={showDone ? 'chevron-up' : 'chevron-down'} size={15} color={C.textFaint} />
            </Pressable>
          )}
          {showDone && <View style={styles.subgroup}>{renderTasks(groups.doneToday)}</View>}
        </View>
      )}

      {/* Hábitos */}
      <SectionHeader title="Hábitos de hoje" count={habitsTotal} onAdd={openNewHabit} />

      {data.habits.length === 0 ? (
        <EmptyState
          icon="leaf-outline"
          title="Nenhum hábito ainda"
          subtitle="Crie hábitos e acompanhe sequências dia após dia."
          actionLabel="Novo hábito"
          onAction={openNewHabit}
        />
      ) : habitsTotal === 0 ? (
        <EmptyState icon="sunny-outline" title="Dia livre!" subtitle="Nenhum hábito programado para hoje." />
      ) : (
        <View style={styles.listCard}>
          {todayHabits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              days={weekDays}
              onToggle={() => toggleHabitToday(h.id)}
              onOpen={() => setHabitModal({ visible: true, habit: h })}
            />
          ))}
        </View>
      )}

      <ChooserSheet
        visible={chooserVisible}
        onClose={() => setChooserVisible(false)}
        title="Adicionar"
        options={[
          { icon: 'checkbox-outline', label: 'Nova tarefa', onPress: openNewTask },
          { icon: 'leaf-outline', label: 'Novo hábito', onPress: openNewHabit },
        ]}
      />

      <TaskModal
        visible={taskModal.visible}
        task={taskModal.task}
        onClose={() => setTaskModal({ visible: false, task: null })}
        onSave={(input: TaskInput) => {
          if (taskModal.task) updateTask(taskModal.task.id, input);
          else addTask(input);
        }}
        onDelete={deleteTask}
      />

      <HabitModal
        visible={habitModal.visible}
        habit={habitModal.habit}
        onClose={() => setHabitModal({ visible: false, habit: null })}
        onSave={(input: HabitInput) => {
          if (habitModal.habit) updateHabit(habitModal.habit.id, input);
          else addHabit(input);
        }}
        onDelete={deleteHabit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.l },
  greeting: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  dateLabel: { color: C.textDim, fontSize: 13, fontWeight: '600', marginTop: 2 },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(38,38,51,0.8)',
  },

  hero: { borderRadius: R.card, padding: SP.xl, gap: SP.l, ...softShadow },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: SP.m },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroNumbers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: SP.s, marginTop: 4 },
  heroPct: { color: '#FFFFFF', fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  heroOf: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  heroFocusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: R.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroFocusText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  heroBarTrack: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 5, backgroundColor: '#FFFFFF' },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.l },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatText: { color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },

  listCard: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: 'rgba(38,38,51,0.8)',
    paddingHorizontal: SP.m,
    paddingVertical: SP.xs,
  },
  subgroup: { paddingVertical: SP.xs },
  subgroupTitle: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: SP.m,
    paddingTop: SP.s,
    paddingBottom: 2,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.m,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(38,38,51,0.6)',
  },
  collapsibleTitle: { color: C.textDim, fontSize: 13, fontWeight: '700' },
});
