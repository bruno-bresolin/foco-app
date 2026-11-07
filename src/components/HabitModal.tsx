/**
 * Modal de criação/edição de hábito: título, categoria e dias da semana.
 *
 * O SheetModal desmonta o formulário ao fechar para reiniciar os campos
 * com os dados do item na próxima abertura.
 */

import React, { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES, type CategoryId } from '@/constants/categories';
import { C, SP } from '@/constants/theme';
import { WEEKDAY_TINY } from '@/lib/dates';
import type { Habit, HabitInput } from '@/lib/types';
import { AppInput, Chip, Field, GhostButton, PrimaryButton, SheetModal } from './ui';

interface HabitModalProps {
  visible: boolean;
  habit: Habit | null;
  onClose: () => void;
  onSave: (input: HabitInput) => void;
  onDelete?: (id: string) => void;
}

export function HabitModal({ visible, habit, onClose, onSave, onDelete }: HabitModalProps) {
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <SheetModal visible={visible} onClose={close} title={habit ? 'Editar hábito' : 'Novo hábito'}>
      <HabitForm habit={habit} onClose={close} onSave={onSave} onDelete={onDelete} />
    </SheetModal>
  );
}

function HabitForm({ habit, onClose, onSave, onDelete }: Omit<HabitModalProps, 'visible'>) {
  const [title, setTitle] = useState(habit?.title ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(habit?.categoryId ?? 'saude');
  const [days, setDays] = useState<number[]>(habit?.days ?? [0, 1, 2, 3, 4, 5, 6]);
  const [error, setError] = useState('');

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Dê um título ao hábito.');
      return;
    }
    if (days.length === 0) {
      setError('Selecione pelo menos um dia da semana.');
      return;
    }
    onSave({ title: trimmed, categoryId, days });
    onClose();
  };

  const remove = () => {
    if (!habit || !onDelete) return;
    Alert.alert('Excluir hábito?', `"${habit.title}" e seu histórico serão removidos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          onDelete(habit.id);
          onClose();
        },
      },
    ]);
  };

  const daily = days.length === 7;

  return (
    <>
      <Field label="Título">
        <AppInput
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (error) setError('');
          }}
          placeholder="Ex.: Ler 20 minutos, Meditar, Beber 2L de água…"
          maxLength={200}
        />
      </Field>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Field label="Categoria">
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              colorDot={c.color}
              selected={categoryId === c.id}
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </View>
      </Field>

      <Field label="Repetir nos dias">
        <View style={styles.dayRow}>
          {WEEKDAY_TINY.map((label, d) => (
            <Chip
              key={d}
              label={label}
              selected={days.includes(d)}
              onPress={() => toggleDay(d)}
              style={styles.dayChip}
            />
          ))}
        </View>
        <View style={styles.quickRow}>
          <Chip label="Todos os dias" selected={daily} onPress={() => setDays([0, 1, 2, 3, 4, 5, 6])} />
          <Chip
            label="Dias de semana"
            selected={days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))}
            onPress={() => setDays([1, 2, 3, 4, 5])}
          />
        </View>
      </Field>

      <View style={styles.actions}>
        <GhostButton label="Cancelar" onPress={onClose} />
        <PrimaryButton label={habit ? 'Salvar alterações' : 'Criar hábito'} onPress={save} />
      </View>

      {habit && onDelete ? <PrimaryButton label="Excluir hábito" danger onPress={remove} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.xs },
  dayChip: { flexGrow: 1, flexBasis: 32, paddingHorizontal: 4, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s, marginTop: SP.s },
  error: { color: C.red, fontSize: 13, fontWeight: '600', marginTop: -SP.xs },
  actions: { flexDirection: 'column-reverse', gap: SP.m, marginTop: SP.s },
});
