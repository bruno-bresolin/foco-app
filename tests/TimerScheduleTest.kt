package com.anonymous.foco

fun main() {
  val start = TimerSchedule(1_000_000L, "foco", 0, 25, 5, 15, 4, true, "Estudar")
  val pause = checkNotNull(start.next())
  check(pause.mode == "pausa" && pause.focusCount == 1)
  check(pause.endsAt == start.endsAt + 5 * 60_000L)
  val focus = checkNotNull(pause.next())
  check(focus.mode == "foco" && focus.focusCount == 1)
  check(focus.endsAt == pause.endsAt + 25 * 60_000L)
  val longBreak = checkNotNull(start.copy(focusCount = 3).next())
  check(longBreak.mode == "pausaLonga" && longBreak.focusCount == 4)
  check(longBreak.endsAt == start.endsAt + 15 * 60_000L)
  val newCycle = checkNotNull(longBreak.next())
  check(newCycle.mode == "foco" && newCycle.focusCount == 0)
  check(start.copy(autoStartNext = false).next() == null)
  val custom = checkNotNull(start.copy(focusMin = 40, breakMin = 7, cyclesBeforeLong = 2, focusCount = 1, longBreakMin = 20).next())
  check(custom.mode == "pausaLonga" && custom.endsAt == start.endsAt + 20 * 60_000L)
  println("Native timer transitions passed")
}
