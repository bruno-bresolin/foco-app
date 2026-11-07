/**
 * Anel de progresso do Pomodoro — SVG com gradiente.
 * `progress` = fração restante (1 -> cheio, 0 -> vazio), atualizado a cada tick.
 */

import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export function RingTimer({
  size,
  strokeWidth,
  progress,
  fromColor,
  toColor,
  trackColor = '#17171F',
  children,
}: {
  size: number;
  strokeWidth: number;
  /** 0..1 (fração restante) */
  progress: number;
  fromColor: string;
  toColor: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const gradId = `ring-${useId().replace(/[:]/g, '')}`;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamped);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={fromColor} />
            <Stop offset="1" stopColor={toColor} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
