const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { initialData } = load('src/lib/types.ts');
const { startTimerState, pauseTimerState, reconcileTimer } = load('src/lib/timer.ts');
const minute = 60_000;
const start = 1_000_000;

test('start, pause and resume keep the remaining time and ignore a duplicate start', () => {
  const running = startTimerState(initialData(), start);
  assert.equal(running.timer.running, true);
  assert.equal(running.timer.endsAt, start + 25 * minute);
  assert.equal(startTimerState(running, start + 1_000), running);
  const paused = pauseTimerState(running, start + 4 * minute);
  assert.equal(paused.timer.running, false);
  assert.equal(paused.timer.remainingMs, 21 * minute);
  assert.equal(paused.timer.endsAt, null);
  assert.equal(reconcileTimer(paused, start + 60 * minute), paused);
  const resumed = startTimerState(paused, start + 60 * minute);
  assert.equal(resumed.timer.endsAt, start + 81 * minute);
});

test('completion records the linked task once and starts the short break', () => {
  const data = initialData();
  data.tasks = [{ id: 'task', title: 'Estudar', focusedMinutes: 0, pomodoros: 0 }];
  data.timer.taskId = 'task';
  const endedAt = start + 25 * minute;
  const completed = reconcileTimer(startTimerState(data, start), endedAt);
  assert.equal(completed.sessions.length, 1);
  assert.equal(completed.sessions[0].endedAt, endedAt);
  assert.equal(completed.tasks[0].focusedMinutes, 25);
  assert.equal(completed.tasks[0].pomodoros, 1);
  assert.equal(completed.timer.mode, 'pausa');
  assert.equal(completed.timer.endsAt, endedAt + 5 * minute);
  assert.equal(reconcileTimer(completed, endedAt), completed);
});

test('returning from the background reconciles multiple phases without losing focus sessions', () => {
  const completed = reconcileTimer(startTimerState(initialData(), start), start + 56 * minute);
  assert.equal(completed.sessions.length, 2);
  assert.equal(completed.timer.mode, 'pausa');
  assert.equal(completed.timer.focusCount, 2);
  assert.equal(completed.timer.endsAt, start + 60 * minute);
});

test('fourth completed focus uses the long break, which resets the cycle', () => {
  const data = initialData();
  data.timer.focusCount = 3;
  const longBreak = reconcileTimer(startTimerState(data, start), start + 25 * minute);
  assert.equal(longBreak.timer.mode, 'pausaLonga');
  assert.equal(longBreak.timer.endsAt, start + 40 * minute);
  const nextFocus = reconcileTimer(longBreak, start + 40 * minute);
  assert.equal(nextFocus.timer.mode, 'foco');
  assert.equal(nextFocus.timer.focusCount, 0);
});

test('disabled auto-start leaves the next phase idle even after a long suspension', () => {
  const data = initialData();
  data.settings.autoStartNext = false;
  const completed = reconcileTimer(startTimerState(data, start), start + 90 * minute);
  assert.equal(completed.sessions.length, 1);
  assert.equal(completed.timer.mode, 'pausa');
  assert.equal(completed.timer.running, false);
  assert.equal(completed.timer.endsAt, null);
});

test('pausing at a deadline reconciles it before pausing the next phase', () => {
  const paused = pauseTimerState(startTimerState(initialData(), start), start + 26 * minute);
  assert.equal(paused.sessions.length, 1);
  assert.equal(paused.timer.mode, 'pausa');
  assert.equal(paused.timer.running, false);
  assert.equal(paused.timer.remainingMs, 4 * minute);
});
