package com.anonymous.foco

import android.app.NotificationManager
import android.content.Intent
import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.common.LifecycleState
import com.facebook.react.uimanager.ViewManager

class FocoTimerModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "FocoTimer"

  @ReactMethod
  fun notificationsEnabled(promise: Promise) {
    promise.resolve(reactApplicationContext.getSystemService(NotificationManager::class.java).areNotificationsEnabled())
  }

  @ReactMethod
  fun sync(payload: String, promise: Promise) {
    try {
      val context = reactApplicationContext
      val intent = Intent(context, FocoTimerService::class.java).putExtra("schedule", payload)
      if (FocoTimerService.active) {
        context.startService(intent)
      } else if (context.lifecycleState == LifecycleState.RESUMED) {
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent)
        else context.startService(intent)
      } else {
        // Android prohibits starting a new foreground service from a background app.
        // The provider retries when the Activity resumes.
        promise.resolve(null)
        return
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("TIMER_NOTIFICATION", "Não foi possível iniciar a notificação do timer.", error)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      if (FocoTimerService.active) {
        reactApplicationContext.startService(
          Intent(reactApplicationContext, FocoTimerService::class.java).setAction(FocoTimerService.STOP)
        )
      } else {
        // Also cancel a start request that has not reached onCreate yet.
        reactApplicationContext.stopService(Intent(reactApplicationContext, FocoTimerService::class.java))
        reactApplicationContext.getSharedPreferences("foco_timer", android.content.Context.MODE_PRIVATE)
          .edit().remove("schedule").apply()
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("TIMER_STOP", "Não foi possível parar a notificação do timer.", error)
    }
  }
}

class FocoTimerPackage : ReactPackage {
  @Suppress("OVERRIDE_DEPRECATION")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(FocoTimerModule(reactContext))
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
