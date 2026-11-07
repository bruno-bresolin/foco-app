package com.anonymous.foco

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.os.*
import android.util.Log
import org.json.JSONObject

/** Owns the notification and completion alerts while the JS runtime is suspended. */
class FocoTimerService : Service() {
  companion object {
    const val STOP = "com.anonymous.foco.STOP_TIMER"
    private const val RUNNING_ID = 4101
    private const val FINISHED_ID = 4102
    private const val RUNNING_CHANNEL = "foco_timer_running"
    private const val FINISHED_CHANNEL = "foco_timer_finished"
    @Volatile var active = false
      private set
  }

  private val handler = Handler(Looper.getMainLooper())
  private var schedule: TimerSchedule? = null
  private var latestStartId = 0
  private var wakeLock: PowerManager.WakeLock? = null
  private val preferences by lazy { getSharedPreferences("foco_timer", MODE_PRIVATE) }
  private val notifications by lazy { getSystemService(NotificationManager::class.java) }
  private val finish = Runnable {
    advanceDue()
    if (schedule == null) stopTimer() else showAndSchedule()
  }

  override fun onCreate() {
    super.onCreate()
    active = true
    if (Build.VERSION.SDK_INT >= 26) {
      notifications.createNotificationChannel(
        NotificationChannel(RUNNING_CHANNEL, "Timer em andamento", NotificationManager.IMPORTANCE_LOW).apply {
          description = "Contagem regressiva da sessão de foco ou pausa."
          setSound(null, null)
          enableVibration(false)
        }
      )
      notifications.createNotificationChannel(
        NotificationChannel(FINISHED_CHANNEL, "Fim da sessão", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "Aviso quando o tempo de foco ou pausa termina."
          enableVibration(true)
        }
      )
    }
  }

  @Suppress("DEPRECATION")
  private fun notificationBuilder(channel: String, alert: Boolean = false): Notification.Builder {
    if (Build.VERSION.SDK_INT >= 26) return Notification.Builder(this, channel)
    return Notification.Builder(this).apply {
      setPriority(if (alert) Notification.PRIORITY_HIGH else Notification.PRIORITY_LOW)
      if (alert) setDefaults(Notification.DEFAULT_ALL) else setSound(null)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    latestStartId = startId
    try {
      // Finish the previous deadline before a JS update can replace it, avoiding a race
      // between the native deadline and the provider's foreground interval.
      advanceDue()
      if (intent?.action == STOP) {
        stopTimer()
        return START_NOT_STICKY
      }
      val payload = intent?.getStringExtra("schedule") ?: preferences.getString("schedule", null)
      if (payload == null) {
        stopTimer()
        return START_NOT_STICKY
      }
      schedule = decode(payload)
      // startForeground must run promptly, even if restoring an expired session.
      showForeground()
      advanceDue()
      if (schedule == null) {
        stopTimer()
        return START_NOT_STICKY
      }
      showAndSchedule()
      return START_STICKY
    } catch (error: Exception) {
      Log.e("FocoTimer", "Unable to run timer notification", error)
      stopTimer()
      return START_NOT_STICKY
    }
  }

  private fun advanceDue() {
    val now = System.currentTimeMillis()
    val current = schedule ?: return
    if (now - current.endsAt > 24 * 3_600_000L) {
      schedule = null
      return
    }
    var latest: TimerSchedule? = null
    while (schedule?.endsAt?.let { it <= now } == true) {
      latest = schedule
      schedule = schedule?.next()
    }
    // If the process was suspended, notify only the most recent completed phase.
    latest?.let { completed ->
      if (preferences.getLong("lastFinishedAt", 0) < completed.endsAt) {
        preferences.edit().putLong("lastFinishedAt", completed.endsAt).apply()
        val text = if (completed.mode == "foco") "Tempo de foco concluído. Hora de descansar!"
          else "Pausa concluída. Pronto para focar?"
        notifications.notify(FINISHED_ID,
          notificationBuilder(FINISHED_CHANNEL, alert = true)
            .setSmallIcon(R.drawable.ic_foco_timer)
            .setContentTitle("${completed.label} concluído")
            .setContentText(text)
            .setCategory(Notification.CATEGORY_ALARM)
            .setContentIntent(openTimer())
            .setAutoCancel(true)
            .build()
        )
      }
    }
  }

  private fun showForeground() {
    val current = schedule ?: return
    val notification = notificationBuilder(RUNNING_CHANNEL)
      .setSmallIcon(R.drawable.ic_foco_timer)
      .setContentTitle("${current.label} em andamento")
      .setContentText(if (current.mode == "foco") current.taskTitle else "Relaxe e respire")
      .setColor(Color.rgb(139, 92, 246))
      .setWhen(current.endsAt)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setCategory(Notification.CATEGORY_STOPWATCH)
      .setContentIntent(openTimer())
      .apply {
        if (Build.VERSION.SDK_INT >= 31) setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
      }
      .build()
    if (Build.VERSION.SDK_INT >= 34) {
      startForeground(RUNNING_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(RUNNING_ID, notification)
    }
  }

  private fun showAndSchedule() {
    val current = schedule ?: return
    showForeground()
    preferences.edit().putString("schedule", encode(current)).apply()
    handler.removeCallbacks(finish)
    val delay = (current.endsAt - System.currentTimeMillis()).coerceAtLeast(1)
    // A bounded partial wake lock lets the deadline run with the screen off.
    // SystemUI renders the chronometer; no per-second notification updates are needed.
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = getSystemService(PowerManager::class.java)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Foco:Pomodoro")
      .apply { acquire(delay + 10_000L) }
    handler.postDelayed(finish, delay)
  }

  private fun stopTimer() {
    schedule = null
    preferences.edit().remove("schedule").apply()
    handler.removeCallbacks(finish)
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelfResult(latestStartId)
  }

  private fun openTimer(): PendingIntent = PendingIntent.getActivity(
    this, 4100,
    Intent(this, MainActivity::class.java).apply {
      action = Intent.ACTION_VIEW
      data = android.net.Uri.parse("foco:///foco")
      addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    },
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )

  override fun onDestroy() {
    active = false
    handler.removeCallbacks(finish)
    wakeLock?.let { if (it.isHeld) it.release() }
    super.onDestroy()
  }

  override fun onBind(intent: Intent?) = null

  private fun decode(payload: String): TimerSchedule {
    val json = JSONObject(payload)
    return TimerSchedule(
      endsAt = json.getLong("endsAt"), mode = json.getString("mode"),
      focusCount = json.getInt("focusCount"), focusMin = json.getInt("focusMin").coerceIn(15, 60),
      breakMin = json.getInt("breakMin").coerceIn(3, 15), longBreakMin = json.getInt("longBreakMin").coerceIn(10, 30),
      cyclesBeforeLong = json.getInt("cyclesBeforeLong").coerceIn(2, 6),
      autoStartNext = json.getBoolean("autoStartNext"), taskTitle = json.getString("taskTitle"),
    )
  }

  private fun encode(current: TimerSchedule): String = JSONObject().apply {
    put("endsAt", current.endsAt); put("mode", current.mode); put("focusCount", current.focusCount)
    put("focusMin", current.focusMin); put("breakMin", current.breakMin); put("longBreakMin", current.longBreakMin)
    put("cyclesBeforeLong", current.cyclesBeforeLong); put("autoStartNext", current.autoStartNext)
    put("taskTitle", current.taskTitle)
  }.toString()
}
