const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { configureManifest, registerPackage, copySources } = require('../plugins/withFocoTimer');

test('prebuild declares permissions and a private foreground service without duplicating entries', () => {
  const manifest = { application: [{ $: {} }] };
  configureManifest(manifest);
  configureManifest(manifest);
  assert.equal(manifest['uses-permission'].length, 4);
  assert.equal(manifest.application[0].service.length, 1);
  const service = manifest.application[0].service[0];
  assert.equal(service.$['android:exported'], 'false');
  assert.equal(service.$['android:foregroundServiceType'], 'specialUse');
  assert.ok(service.property[0].$['android:value'].includes('Pomodoro'));
});

test('registers the timer in a clean generated MainApplication exactly once', () => {
  const source = 'PackageList(this).packages.apply {\n // generated\n }';
  const registered = registerPackage(source);
  assert.ok(registered.includes('add(com.anonymous.foco.FocoTimerPackage())'));
  assert.equal(registerPackage(registered), registered);
  assert.throws(() => registerPackage('unknown template'), /unable to register/);
});

test('prebuild copies all native sources and the notification icon', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'foco-prebuild-test-'));
  try {
    copySources(path.resolve(__dirname, '..'), target);
    for (const file of ['FocoTimerService.kt', 'FocoTimerModule.kt', 'TimerSchedule.kt']) {
      assert.equal(fs.readFileSync(path.join(target, 'app/src/main/java/com/anonymous/foco', file), 'utf8'),
        fs.readFileSync(path.join(__dirname, '../native/android', file), 'utf8'));
    }
    assert.ok(fs.existsSync(path.join(target, 'app/src/main/res/drawable/ic_foco_timer.xml')));
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});
