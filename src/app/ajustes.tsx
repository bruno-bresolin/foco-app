/**
 * Ajustes — durações do Pomodoro, comportamento, backup dos dados e sobre.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { ActionRow, Card, Screen, SectionHeader, Stepper, SwitchRow } from '@/components/ui';
import { useApp } from '@/context/app';
import { C, SP } from '@/constants/theme';
import { exportBackup, importBackup } from '@/lib/backup';
import { SETTINGS_BOUNDS } from '@/lib/types';

export default function SettingsScreen() {
  const { data, updateSettings, replaceAll, resetAll, loaded } = useApp();
  const [busy, setBusy] = useState(false);

  const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`;

  const doExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportBackup(data);
    } catch (e) {
      Alert.alert('Não foi possível exportar', e instanceof Error ? e.message : 'Erro inesperado.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const imported = await importBackup();
      Alert.alert(
        'Importar backup?',
        `O backup contém ${plural(imported.tasks.length, 'tarefa', 'tarefas')}, ${plural(imported.habits.length, 'hábito', 'hábitos')} e ${plural(imported.sessions.length, 'sessão', 'sessões')}. Os dados atuais serão substituídos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Substituir',
            onPress: () => {
              replaceAll(imported);
              Alert.alert('Backup importado', 'Seus dados foram restaurados com sucesso.');
            },
          },
        ],
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro inesperado.';
      if (msg !== 'Nenhum arquivo selecionado.') {
        Alert.alert('Não foi possível importar', msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const doReset = () => {
    Alert.alert('Apagar todos os dados?', 'Tarefas, hábitos, sessões e ajustes serão removidos. Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar tudo',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Tem certeza absoluta?', 'Esta é a última chance antes de apagar tudo.', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Apagar', style: 'destructive', onPress: resetAll },
          ]);
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Ajustes</Text>
        <Text style={styles.subtitle}>Personalize o Foco do seu jeito</Text>
      </View>

      <SectionHeader title="Pomodoro" />
      <Card>
        <Stepper
          label="Duração do foco"
          value={data.settings.focusMin}
          min={SETTINGS_BOUNDS.focusMin.min}
          max={SETTINGS_BOUNDS.focusMin.max}
          step={SETTINGS_BOUNDS.focusMin.step}
          suffix=" min"
          onChange={(v) => updateSettings({ focusMin: v })}
        />
        <View style={styles.divider} />
        <Stepper
          label="Pausa curta"
          value={data.settings.breakMin}
          min={SETTINGS_BOUNDS.breakMin.min}
          max={SETTINGS_BOUNDS.breakMin.max}
          step={SETTINGS_BOUNDS.breakMin.step}
          suffix=" min"
          onChange={(v) => updateSettings({ breakMin: v })}
        />
        <View style={styles.divider} />
        <Stepper
          label="Pausa longa"
          value={data.settings.longBreakMin}
          min={SETTINGS_BOUNDS.longBreakMin.min}
          max={SETTINGS_BOUNDS.longBreakMin.max}
          step={SETTINGS_BOUNDS.longBreakMin.step}
          suffix=" min"
          onChange={(v) => updateSettings({ longBreakMin: v })}
        />
        <View style={styles.divider} />
        <Stepper
          label="Sessões antes da pausa longa"
          value={data.settings.cyclesBeforeLong}
          min={SETTINGS_BOUNDS.cyclesBeforeLong.min}
          max={SETTINGS_BOUNDS.cyclesBeforeLong.max}
          step={SETTINGS_BOUNDS.cyclesBeforeLong.step}
          onChange={(v) => updateSettings({ cyclesBeforeLong: v })}
        />
      </Card>

      <SectionHeader title="Comportamento" />
      <Card>
        <SwitchRow
          label="Iniciar próxima sessão"
          description="Começa pausas e focos automaticamente ao término de cada sessão."
          value={data.settings.autoStartNext}
          onChange={(v) => updateSettings({ autoStartNext: v })}
        />
        <View style={styles.divider} />
        <SwitchRow
          label="Vibração e hápticos"
          description="Feedback tátil ao concluir sessões e marcar itens."
          value={data.settings.haptics}
          onChange={(v) => updateSettings({ haptics: v })}
        />
      </Card>

      <SectionHeader title="Dados" />
      <Card>
        <ActionRow
          icon="share-social-outline"
          label="Exportar backup"
          description={`${plural(data.tasks.length, 'tarefa', 'tarefas')} · ${plural(data.habits.length, 'hábito', 'hábitos')} · ${plural(data.sessions.length, 'sessão', 'sessões')}`}
          onPress={doExport}
        />
        <View style={styles.divider} />
        <ActionRow
          icon="folder-open-outline"
          label="Importar backup"
          description="Restaura de um arquivo JSON exportado pelo Foco."
          onPress={doImport}
        />
      </Card>

      <SectionHeader title="Zona de perigo" />
      <Card>
        <ActionRow
          icon="trash-outline"
          label="Apagar todos os dados"
          description="Remove tudo e volta ao estado inicial."
          onPress={doReset}
          danger
        />
      </Card>

      <SectionHeader title="Sobre" />
      <Card style={styles.aboutCard}>
        <View style={styles.aboutLogo}>
          <Ionicons name="flash" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.aboutName}>Foco</Text>
          <Text style={styles.aboutText}>Tarefas, hábitos e Pomodoro em um só lugar.</Text>
          <Text style={styles.aboutVersion}>
            v1.0.0 · Expo SDK 58 · React Native {loaded ? '· dados locais' : ''}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: SP.l },
  title: { color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { color: C.textDim, fontSize: 13, fontWeight: '600', marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(38,38,51,0.6)', marginVertical: 4 },
  aboutCard: { flexDirection: 'row', alignItems: 'center', gap: SP.l },
  aboutLogo: {
    flexShrink: 0,
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutName: { color: C.text, fontSize: 17, fontWeight: '800' },
  aboutText: { color: C.textDim, fontSize: 12.5, fontWeight: '600', marginTop: 1 },
  aboutVersion: { color: C.textFaint, fontSize: 11, fontWeight: '600', marginTop: 3 },
});
