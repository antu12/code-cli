import test from 'node:test';
import assert from 'node:assert/strict';

import { getAvailabilityCommand, resolveExecutablePath } from '../src/core/agents/backends/availability.ts';

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

test('resolveExecutablePath prefers explicit environment override', async () => {
  const resolved = await resolveExecutablePath('codex', {
    CODEX_CLI_PATH: 'C:\\tools\\codex.exe'
  });

  assert.equal(resolved, 'C:\\tools\\codex.exe');
});
