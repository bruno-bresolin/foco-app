package com.anonymous.foco

/** Same wall-clock transitions as src/lib/timer.ts; independent of JS suspension. */
data class TimerSchedule(
  val endsAt: Long,
  val mode: String,
  val focusCount: Int,
  val focusMin: Int,
  val breakMin: Int,
  val longBreakMin: Int,
  val cyclesBeforeLong: Int,
  val autoStartNext: Boolean,
  val taskTitle: String,
) {
  fun next(): TimerSchedule? {
    if (!autoStartNext) return null
    val nextCount = when (mode) {
      "foco" -> focusCount + 1
      "pausaLonga" -> 0
      else -> focusCount
    }
    val nextMode = if (mode != "foco") "foco"
      else if (nextCount >= cyclesBeforeLong) "pausaLonga" else "pausa"
    val minutes = when (nextMode) {
      "foco" -> focusMin
      "pausaLonga" -> longBreakMin
      else -> breakMin
    }
    return copy(endsAt = endsAt + minutes * 60_000L, mode = nextMode, focusCount = nextCount)
  }

  val label: String get() = when (mode) {
    "foco" -> "Foco"
    "pausaLonga" -> "Pausa longa"
    else -> "Pausa curta"
  }
}
