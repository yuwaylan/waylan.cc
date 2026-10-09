import test from 'node:test';
import assert from 'node:assert/strict';
import { getCountdown } from '../src/lib/countdown';

test('unset or ambiguous departure dates never start a fabricated countdown', () => {
  for (const target of [null, undefined, '', 'invalid', '2026-12-01', '2026-12-01T09:00:00'])
    assert.equal(getCountdown(target), null);
});
test('countdown respects explicit Taipei offset and divides remaining time', () => {
  const now = Date.parse('2026-12-01T00:00:00Z');
  assert.deepEqual(getCountdown('2026-12-02T10:03:04+08:00', now), {
    departed: false,
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
  });
});
test('countdown stops at departure and never displays a negative duration', () => {
  const target = '2026-12-01T09:00:00+08:00';
  for (const now of [Date.parse(target), Date.parse(target) + 86400000])
    assert.deepEqual(getCountdown(target, now), {
      departed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
});
