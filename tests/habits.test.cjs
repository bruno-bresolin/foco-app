const test = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { dayKey, fromKey, addDays } = load('src/lib/dates.ts');
const { habitsOnDate, isHabitScheduledOn, bestStreak } = load('src/lib/stats.ts');

const habit = {
  id: 'ler', title: 'Ler', categoryId: 'pessoal', days: [1, 4],
  history: ['2026-11-02', '2026-11-05'],
  createdAt: new Date(2026, 10, 2, 0).getTime(),
};

test('hábito de dois dias só entra no progresso dos dias escolhidos', () => {
  assert.equal(isHabitScheduledOn(habit, fromKey('2026-11-02')), true);
  assert.deepEqual(habitsOnDate([habit], fromKey('2026-11-02')), { done: 1, scheduled: 1 });
  assert.deepEqual(habitsOnDate([habit], fromKey('2026-11-03')), { done: 0, scheduled: 0 });
  assert.deepEqual(habitsOnDate([habit], fromKey('2026-11-09')), { done: 0, scheduled: 1 });
});

test('hábito semanal considera domingo como zero', () => {
  const weekly = { ...habit, days: [0], history: [] };
  assert.deepEqual(habitsOnDate([weekly], fromKey('2026-11-08')), { done: 0, scheduled: 1 });
  assert.deepEqual(habitsOnDate([weekly], fromKey('2026-11-09')), { done: 0, scheduled: 0 });
});

test('dias sem agendamento não quebram o recorde de sequência', () => {
  assert.equal(bestStreak(habit), 2);
});

test('chaves de histórico preservam o dia local e atravessam virada de mês', () => {
  assert.equal(dayKey(new Date(2026, 10, 1, 23, 59)), '2026-11-01');
  assert.equal(dayKey(fromKey('2026-11-01')), '2026-11-01');
  assert.equal(dayKey(addDays(fromKey('2026-11-01'), -1)), '2026-10-31');
});
