import test from 'node:test';
import assert from 'node:assert/strict';

import { getAvailabilityCommand } from '../src/core/agents/backends/availability.ts';

test('getAvailabilityCommand uses where.exe on Windows', () => {
  assert.deepEqual(getAvailabilityCommand('codex', 'win32'), {
    file: 'where.exe',
    args: ['codex']
  });
});

test('getAvailabilityCommand uses which on POSIX platforms', () => {
  assert.deepEqual(getAvailabilityCommand('claude', 'linux'), {
    file: 'which',
    args: ['claude']
  });
});
