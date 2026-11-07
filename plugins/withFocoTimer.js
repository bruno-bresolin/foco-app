const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest, withMainApplication, withDangerousMod } = require('@expo/config-plugins');

const permissions = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.WAKE_LOCK',
];

function configureManifest(manifest) {
  manifest['uses-permission'] ??= [];
  for (const name of permissions) {
    if (!manifest['uses-permission'].some((item) => item.$['android:name'] === name)) {
      manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
  }
  const application = manifest.application[0];
  application.service ??= [];
  const service = {
    $: {
      'android:name': 'com.anonymous.foco.FocoTimerService',
      'android:exported': 'false',
      'android:foregroundServiceType': 'specialUse',
    },
    property: [{ $: {
      'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
      'android:value': 'User-started Pomodoro countdown with a live notification and completion alert while the screen is off.',
    } }],
  };
  const index = application.service.findIndex((item) => item.$['android:name'] === service.$['android:name']);
  if (index >= 0) application.service[index] = service;
  else application.service.push(service);
  return manifest;
}

function registerPackage(contents) {
  if (contents.includes('add(com.anonymous.foco.FocoTimerPackage())')) return contents;
  const marker = /PackageList\(this\)\.packages\.apply\s*\{/;
  if (!marker.test(contents)) throw new Error('Foco timer: unable to register native package in MainApplication.kt');
  return contents.replace(marker, (match) => `${match}\n          add(com.anonymous.foco.FocoTimerPackage())`);
}

function copySources(projectRoot, androidRoot) {
  const source = path.join(projectRoot, 'native/android');
  const target = path.join(androidRoot, 'app/src/main/java/com/anonymous/foco');
  const drawable = path.join(androidRoot, 'app/src/main/res/drawable');
  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(drawable, { recursive: true });
  for (const filename of ['TimerSchedule.kt', 'FocoTimerModule.kt', 'FocoTimerService.kt']) {
    fs.copyFileSync(path.join(source, filename), path.join(target, filename));
  }
  fs.copyFileSync(path.join(source, 'ic_foco_timer.xml'), path.join(drawable, 'ic_foco_timer.xml'));
}

module.exports = function withFocoTimer(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults.manifest = configureManifest(mod.modResults.manifest);
    return mod;
  });
  config = withMainApplication(config, (mod) => {
    if (mod.modResults.language !== 'kt') throw new Error('Foco timer requires Kotlin MainApplication');
    mod.modResults.contents = registerPackage(mod.modResults.contents);
    return mod;
  });
  return withDangerousMod(config, ['android', (mod) => {
    copySources(mod.modRequest.projectRoot, mod.modRequest.platformProjectRoot);
    return mod;
  }]);
};

module.exports.configureManifest = configureManifest;
module.exports.registerPackage = registerPackage;
module.exports.copySources = copySources;
