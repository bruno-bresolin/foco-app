/**
 * Gráfico de barras semanal customizado — sem dependências externas.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { C } from '@/constants/theme';

export interface WeekChartProps {
  values: number[];
  labels: string[];
  color: string;
  /** índice do dia de hoje para destaque */
  highlightIndex?: number;
  /** sufixo do valor (ex.: 'min') */
  suffix?: string;
  /** altura da área das barras */
  height?: number;
  /** formato do valor exibido acima da barra */
  formatValue?: (v: number) => string;
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const step = max > 240 ? 120 : max > 120 ? 60 : max > 60 ? 30 : max > 12 ? 6 : max > 6 ? 3 : 1;
  return Math.ceil(max / step) * step;
}

export function WeekChart({
  values,
  labels,
  color,
  highlightIndex,
  suffix = '',
  height = 130,
  formatValue,
}: WeekChartProps) {
  const max = niceMax(Math.max(...values, 0));
  const key = values.join(',');

  return (
    <View style={styles.wrap}>
      <View style={[styles.chart, { height }]}>
        {values.map((v, i) => {
          const isToday = i === highlightIndex;
          const barHeight = Math.max(3, Math.round((Math.max(0, v) / max) * (height - 8)));
          return (
            <View key={`${key}-${i}`} style={styles.col}>
              <Text style={[styles.value, isToday && { color, opacity: 1 }]} numberOfLines={1}>
                {v > 0 ? (formatValue ? formatValue(v) : `${v}${suffix}`) : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight, backgroundColor: color, opacity: isToday ? 1 : 0.5 },
                  ]}
                />
              </View>
              <Text style={[styles.label, isToday && { color: C.text, fontWeight: '800' }]}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  value: { color: C.textFaint, fontSize: 10, fontWeight: '700', opacity: 0.85, fontVariant: ['tabular-nums'], minHeight: 12 },
  barTrack: { width: '70%', maxWidth: 26, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '100%', borderRadius: 5 },
  label: { color: C.textFaint, fontSize: 11, fontWeight: '600' },
});
