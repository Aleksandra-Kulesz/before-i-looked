import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads 5 jobs and counts the bad line', () => {
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(night?.badLines).toBe(1);
  });

  it('counts runs and retries, and keeps the last error', () => {
    const fixtures = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fixtures).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    const backup = night?.rows.find((r) => r.job === 'notes/backup');
    expect(backup).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null', () => {
    expect(night?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('keeps the offset from the log', () => {
    const sync = night?.rows.find((r) => r.job === 'lane/sync');
    expect(sync?.firstAt).toBe('2026-10-28T23:00:06+01:00');
  });

  it('returns null for a night with no file or a night that is not a date', () => {
    expect(readNight('runs', '2026-01-01')).toBeNull();
    expect(readNight('runs', '../package')).toBeNull();
  });
});
