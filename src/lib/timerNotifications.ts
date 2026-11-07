import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

import type { AppSettings, TimerState } from './types';

type TimerModule = {
  sync: (payload: string) => Promise<void>;
  stop: () => Promise<void>;
  notificationsEnabled: () => Promise<boolean>;
};

const nativeTimer = NativeModules.FocoTimer as TimerModule | undefined;

/** Permission is requested only after an explicit tap on Start. */
export async function prepareTimerNotifications(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  if (!nativeTimer) return 'Para receber notificações do timer, instale a nova versão Android do app.';
  try {
    if (Number(Platform.Version) >= 33) {
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!(await PermissionsAndroid.check(permission))) {
        const result = await PermissionsAndroid.request(permission);
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          return 'O timer funciona sem notificações. Para ver a contagem e receber o aviso final, permita notificações nos ajustes do Android.';
        }
      }
    }
    return await nativeTimer.notificationsEnabled()
      ? null
      : 'As notificações do Foco estão desativadas nos ajustes do Android.';
  } catch {
    return 'Não foi possível verificar as notificações. O timer continua disponível.';
  }
}

export async function syncTimerNotification(timer: TimerState, settings: AppSettings, taskTitle: string): Promise<void> {
  if (Platform.OS !== 'android' || !nativeTimer) return;
  if (!timer.running || timer.endsAt === null) {
    await nativeTimer.stop();
    return;
  }
  await nativeTimer.sync(JSON.stringify({
    endsAt: timer.endsAt,
    mode: timer.mode,
    focusCount: timer.focusCount,
    focusMin: settings.focusMin,
    breakMin: settings.breakMin,
    longBreakMin: settings.longBreakMin,
    cyclesBeforeLong: settings.cyclesBeforeLong,
    autoStartNext: settings.autoStartNext,
    taskTitle,
  }));
}
