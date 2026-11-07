/**
 * Modal de criação/edição de tarefa: título, categoria, prioridade,
 * prazo (chips rápidos + seletor de data) e notas.
 *
 * O SheetModal desmonta o formulário ao fechar para reiniciar os campos
 * com os dados do item na próxima abertura.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES, type CategoryId } from '@/constants/categories';
import { C, SP } from '@/constants/theme';
import { addDays, dayKey, dueInfo, fromKey, shortDateLabel } from '@/lib/dates';
import type { Priority, Task, TaskInput } from '@/lib/types';
import { AppInput, Chip, Field, GhostButton, PrimaryButton, SheetModal } from './ui';

interface TaskModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
  onDelete?: (id: string) => void;
}

export function TaskModal({ visible, task, onClose, onSave, onDelete }: TaskModalProps) {
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  return (
    <SheetModal visible={visible} onClose={close} title={task ? 'Editar tarefa' : 'Nova tarefa'}>
      <TaskForm task={task} onClose={close} onSave={onSave} onDelete={onDelete} />
    </SheetModal>
  );
}

function TaskForm({ task, onClose, onSave, onDelete }: Omit<TaskModalProps, 'visible'>) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [categoryId, setCategoryId] = useState<CategoryId>(task?.categoryId ?? 'pessoal');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'media');
  const [dueDate, setDueDate] = useState<string | null>(task?.dueDate ?? null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(() => (task?.dueDate ? fromKey(task.dueDate) : new Date()));
  const [error, setError] = useState('');

  const quickDates = useMemo(() => {
    const today = new Date();
    return [
      { key: dayKey(today), label: 'Hoje' },
      { key: dayKey(addDays(today, 1)), label: 'Amanhã' },
      { key: dayKey(addDays(today, 7)), label: 'Em 7 dias' },
    ];
  }, []);

  const quickKeys = quickDates.map((q) => q.key);
  const isCustomDate = dueDate !== null && !quickKeys.includes(dueDate);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Dê um título à tarefa.');
      return;
    }
    onSave({
      title: trimmed,
      notes: notes.trim(),
      categoryId,
      priority,
      dueDate,
    });
    onClose();
  };

  const remove = () => {
    if (!task || !onDelete) return;
    Alert.alert('Excluir tarefa?', `"${task.title}" será removida permanentemente.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          onDelete(task.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <>
      <Field label="Título">
        <AppInput
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (error) setError('');
          }}
          placeholder="O que precisa ser feito?"
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

      <Field label="Prioridade">
        <View style={styles.prioRow}>
          {(
            [
              { value: 'baixa', label: 'Baixa', color: C.textDim },
              { value: 'media', label: 'Média', color: C.orange },
              { value: 'alta', label: 'Alta', color: C.red },
            ] as const
          ).map((p) => {
            const active = priority === p.value;
            return (
              <Chip
                key={p.value}
                label={p.label}
                selected={active}
                onPress={() => setPriority(p.value)}
                style={[styles.prioChip, active && { borderColor: p.color }]}
                textStyle={active ? { color: p.color } : undefined}
              />
            );
          })}
        </View>
      </Field>

      <Field label="Prazo">
        <View style={styles.chips}>
          {quickDates.map((q) => (
            <Chip key={q.key} label={q.label} selected={dueDate === q.key} onPress={() => setDueDate(q.key)} />
          ))}
          {isCustomDate && dueDate && (
            <Chip label={shortDateLabel(fromKey(dueDate))} selected onPress={() => setDueDate(null)} colorDot={C.accent} />
          )}
          <Chip label="Sem data" selected={dueDate === null} onPress={() => setDueDate(null)} />
          <Chip
            label="Escolher…"
            onPress={() => {
              setPickerValue(dueDate ? fromKey(dueDate) : new Date());
              setShowPicker(true);
            }}
            textStyle={{ color: C.accentLight }}
          />
        </View>
        {dueDate && <Text style={styles.dueHint}>{dueInfo(dueDate).label}</Text>}
      </Field>

      {showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_e, d) => {
            if (Platform.OS === 'android') setShowPicker(false);
            if (d) {
              setPickerValue(d);
              if (Platform.OS === 'android') setDueDate(dayKey(d));
            }
          }}
        />
      )}

      <Field label="Notas (opcional)">
        <AppInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Detalhes, links, contexto…"
          multiline
          maxLength={2000}
          style={styles.notesInput}
        />
      </Field>

      <View style={styles.actions}>
        <GhostButton label="Cancelar" onPress={onClose} />
        <PrimaryButton label={task ? 'Salvar alterações' : 'Criar tarefa'} onPress={save} />
      </View>

      {task && onDelete ? <PrimaryButton label="Excluir tarefa" danger onPress={remove} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.s },
  prioRow: { flexDirection: 'row', gap: SP.s },
  prioChip: { flex: 1, alignItems: 'center' },
  dueHint: { color: C.textFaint, fontSize: 12, marginTop: -2 },
  notesInput: { minHeight: 84, textAlignVertical: 'top', fontWeight: '500' },
  error: { color: C.red, fontSize: 13, fontWeight: '600', marginTop: -SP.xs },
  actions: { flexDirection: 'column-reverse', gap: SP.m, marginTop: SP.s },
});
