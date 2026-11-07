/**
 * Progresso — estatísticas dos últimos 7 dias: foco, tarefas, hábitos e sequências.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WeekChart } from '@/components/WeekChart';
import { Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { useApp } from '@/context/app';
import { categoryColor } from '@/constants/categories';
import { C, R, SP } from '@/constants/theme';
import { WEEKDAY_SHORT, dayKey, lastNDays } from '@/lib/dates';
import { bestStreak, currentStreak, isHabitDoneOn, isHabitScheduledOn, weekStats, weekSummary } from '@/lib/stats';

export default function StatsScreen() {
  const { data } = useApp();

  const days = useMemo(() => weekStats(data), [data]);
  const summary = useMemo(() => weekSummary(data), [data]);
  const weekDates = useMemo(() => lastNDays(7), []);
  const todayIdx = 6;

  const labels = weekDates.map((d) => WEEKDAY_SHORT[d.getDay()]);
  const hasAnyData =
    summary.focusMin > 0 || summary.tasksDone > 0 || summary.habitsDone > 0 || data.tasks.some((t) => t.completed);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Progresso</Text>
        <Text style={styles.subtitle}>Últimos 7 dias</Text>
      </View>

      {!hasAnyData ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Sem dados por enquanto"
          subtitle="Conclua tarefas, hábitos e sessões de foco para ver seu progresso aqui."
        />
      ) : (
        <>
          {/* Cartões-resumo */}
          <View style={styles.summaryGrid}>
            <SummaryCard
              icon="time"
              iconColor={C.accentLight}
              iconBg={C.accentSoft}
              value={`${summary.focusMin}`}
              unit="min"
              label="de foco"
            />
            <SummaryCard
              icon="checkmark-done"
              iconColor={C.green}
              iconBg={C.greenSoft}
              value={`${summary.tasksDone}`}
              unit=""
              label="tarefas feitas"
            />
            <SummaryCard
              icon="flame"
              iconColor={C.orange}
              iconBg={C.orangeSoft}
              value={`${summary.bestCurrentStreak}`}
              unit={summary.bestCurrentStreak === 1 ? 'dia' : 'dias'}
              label="melhor sequência"
            />
            <SummaryCard
              icon="repeat"
              iconColor={C.pink}
              iconBg={C.pinkSoft}
              value={summary.habitRate === null ? '—' : `${summary.habitRate}`}
              unit={summary.habitRate === null ? '' : '%'}
              label="hábitos na semana"
            />
          </View>

          {/* Foco por dia */}
          <SectionHeader title="Minutos de foco" actionLabel={`média ${summary.focusAvgPerDay} min/dia`} />
          <Card>
            <WeekChart
              values={days.map((d) => d.focusMin)}
              labels={labels}
              color={C.accent}
              highlightIndex={todayIdx}
              suffix=" min"
            />
          </Card>

          {/* Tarefas por dia */}
          <SectionHeader title="Tarefas concluídas" />
          <Card>
            <WeekChart
              values={days.map((d) => d.tasksDone)}
              labels={labels}
              color={C.green}
              highlightIndex={todayIdx}
            />
          </Card>

          {/* Hábitos por dia */}
          <SectionHeader title="Hábitos concluídos" />
          <Card>
            <WeekChart
              values={days.map((d) => (d.habitsScheduled > 0 ? Math.round((d.habitsDone / d.habitsScheduled) * 100) : 0))}
              labels={labels}
              color={C.pink}
              highlightIndex={todayIdx}
              suffix="%"
            />
          </Card>

          {/* Sequências por hábito */}
          {data.habits.length > 0 && (
            <>
              <SectionHeader title="Sequências" count={data.habits.length} />
              <Card style={styles.streaksCard}>
                {data.habits.map((h, idx) => {
                  const catColor = categoryColor(h.categoryId);
                  const streak = currentStreak(h);
                  const best = bestStreak(h);
                  return (
                    <View key={h.id} style={[styles.streakRow, idx > 0 && styles.streakRowBorder]}>
                      <View style={styles.streakInfo}>
                        <View style={[styles.streakDot, { backgroundColor: catColor }]} />
                        <Text style={styles.streakTitle} numberOfLines={1}>
                          {h.title}
                        </Text>
                      </View>
                      <View style={styles.streakWeek}>
                        {weekDates.map((d) => {
                          const key = dayKey(d);
                          const scheduled = isHabitScheduledOn(h, d);
                          const done = isHabitDoneOn(h, key);
                          return (
                            <View
                              key={key}
                              style={[
                                styles.streakDay,
                                done && { backgroundColor: catColor },
                                !done && scheduled && styles.streakDayMissed,
                                !done && !scheduled && styles.streakDayOff,
                              ]}
                            />
                          );
                        })}
                        <View style={styles.streakNumbers}>
                          <Ionicons name="flame" size={13} color={streak > 0 ? C.orange : C.textFaint} />
                          <Text style={styles.streakNum}>{streak}</Text>
                          <Text style={styles.streakBest}>· máx {best}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

function SummaryCard({
  icon,
  iconColor,
  iconBg,
  value,
  unit,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string;
  unit: string;
  label: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <View style={styles.summaryValueRow}>
        <Text style={styles.summaryValue}>{value}</Text>
        {unit ? <Text style={styles.summaryUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: SP.l },
  title: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { color: C.textDim, fontSize: 13, fontWeight: '600', marginTop: 2 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.m },
  summaryCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: 'rgba(38,38,51,0.8)',
    padding: SP.l,
    gap: SP.xs,
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: SP.xs },
  summaryValue: { color: C.text, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  summaryUnit: { color: C.textDim, fontSize: 12, fontWeight: '700' },
  summaryLabel: { color: C.textFaint, fontSize: 12, fontWeight: '600' },

  streaksCard: { gap: 0, paddingVertical: SP.m },
  streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, gap: SP.m },
  streakRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(38,38,51,0.6)' },
  streakInfo: { flexDirection: 'row', alignItems: 'center', gap: SP.s, flexShrink: 1, flex: 1 },
  streakDot: { width: 9, height: 9, borderRadius: 5 },
  streakTitle: { color: C.text, fontSize: 14, fontWeight: '700' },
  streakWeek: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  streakDay: { width: 8, height: 8, borderRadius: 4 },
  streakDayMissed: { backgroundColor: 'rgba(248,113,113,0.35)' },
  streakDayOff: { backgroundColor: C.surface3, width: 4, height: 4 },
  streakNumbers: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6 },
  streakNum: { color: C.text, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  streakBest: { color: C.textFaint, fontSize: 10.5, fontWeight: '600' },
});
