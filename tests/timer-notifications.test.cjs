const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

function setup({ os = 'android', version = 33, granted = true, enabled = true, available = true } = {}) {
  const calls = [];
  const nativeTimer = {
    sync: async (payload) => { calls.push(['sync', JSON.parse(payload)]); },
    stop: async () => { calls.push(['stop']); },
    notificationsEnabled: async () => enabled,
  };
  const api = load('src/lib/timerNotifications.ts', {
    'react-native': {
      Platform: { OS: os, Version: version },
      NativeModules: available ? { FocoTimer: nativeTimer } : {},
      PermissionsAndroid: {
        PERMISSIONS: { POST_NOTIFICATIONS: 'notifications' },
        RESULTS: { GRANTED: 'granted' },
        check: async () => granted,
        request: async () => { calls.push(['request']); return granted ? 'granted' : 'denied'; },
      },
    },
  });
  return { ...api, calls, nativeTimer };
}

test('Android 13 denial explains the missing notifications without throwing', async () => {
  const api = setup({ granted: false });
  assert.match(await api.prepareTimerNotifications(), /timer funciona sem notificações/);
  assert.deepEqual(api.calls, [['request']]);
});

test('granted permission and enabled notifications produce no warning', async () => {
  const api = setup();
  assert.equal(await api.prepareTimerNotifications(), null);
  assert.deepEqual(api.calls, []);
});

test('Android below 13 checks notification settings without runtime permission', async () => {
  const api = setup({ version: 32, granted: false, enabled: false });
  assert.match(await api.prepareTimerNotifications(), /desativadas/);
  assert.deepEqual(api.calls, []);
});

test('Expo Go explains that the native Android update is needed', async () => {
  const api = setup({ available: false });
  assert.match(await api.prepareTimerNotifications(), /nova versão Android/);
  await api.syncTimerNotification({ running: true, endsAt: 123 }, {}, 'Livre');
  assert.deepEqual(api.calls, []);
});

test('web and iOS do not call the Android notification API', async () => {
  for (const os of ['web', 'ios']) {
    const api = setup({ os });
    assert.equal(await api.prepareTimerNotifications(), null);
    await api.syncTimerNotification({ running: true, endsAt: 123 }, {}, 'Livre');
    assert.deepEqual(api.calls, []);
  }
});

test('sync sends the running deadline and cycle settings, then stops on pause', async () => {
  const api = setup();
  const timer = { running: true, endsAt: 123, mode: 'foco', focusCount: 2 };
  const settings = { focusMin: 25, breakMin: 5, longBreakMin: 15, cyclesBeforeLong: 4, autoStartNext: true };
  await api.syncTimerNotification(timer, settings, 'Ler');
  assert.deepEqual(api.calls[0], ['sync', { endsAt: 123, mode: 'foco', focusCount: 2, ...settings, taskTitle: 'Ler' }]);
  await api.syncTimerNotification({ ...timer, running: false, endsAt: null }, settings, 'Ler');
  assert.deepEqual(api.calls[1], ['stop']);
});

test('native sync failures propagate so the UI can display the failure', async () => {
  const api = setup();
  api.nativeTimer.sync = async () => { throw new Error('service unavailable'); };
  await assert.rejects(() => api.syncTimerNotification({ running: true, endsAt: 123 }, {}, 'Livre'), /service unavailable/);
});
