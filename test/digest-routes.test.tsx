import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const line = (o: object) => JSON.stringify(o);
let runsDir: string;

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(
    join(runsDir, '2026-02-01.jsonl'),
    [
      line({ at: '2026-02-01T01:00:00+01:00', job: 'b/job', status: 'ok', owner: 'rook' }),
      line({ at: '2026-02-01T02:00:00+01:00', job: 'a/job', status: 'retry', owner: null, error: 'x' }),
      line({ at: '2026-02-01T02:01:00+01:00', job: 'a/job', status: 'retry', owner: null, error: 'x' }),
      line({ at: '2026-02-01T02:02:00+01:00', job: 'a/job', status: 'retry', owner: null, error: 'x' }),
      line({ at: '2026-02-01T03:00:00+01:00', job: 'c/job', status: 'fail', owner: 'rook', error: 'boom' }),
      '{"at":"2026-02-01T04:00:00+01:00","job":"cut/of',
    ].join('\n'),
  );
  writeFileSync(join(runsDir, '2026-02-02.jsonl'), '');
});

afterAll(() => rmSync(runsDir, { recursive: true, force: true }));

const app = () =>
  createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

describe('GET /digest/:night', () => {
  it('renders a night with a bad line, marking 3 retries and fail', async () => {
    const res = await app().request('/digest/2026-02-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('3 retries');
    expect(html).toContain('boom');
    expect(html).toContain('1 line in the log could not be read');
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
  });

  it('shows — for a missing owner', async () => {
    const html = await (await app().request('/digest/2026-02-01')).text();
    expect(html).toContain('<td>—</td>');
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await app().request('/digest/2026-02-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('404s for a night with no file and for a night that is not a date', async () => {
    expect((await app().request('/digest/2026-03-03')).status).toBe(404);
    expect((await app().request('/digest/..%2Fpackage')).status).toBe(404);
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the rows of the page, in the same order', async () => {
    const res = await app().request('/api/digest/2026-02-01');
    const json = (await res.json()) as { rows: { job: string }[]; badLines: number };
    expect(res.status).toBe(200);
    expect(json.rows.map((r) => r.job)).toEqual(['a/job', 'b/job', 'c/job']);
    expect(json.badLines).toBe(1);
    const html = await (await app().request('/digest/2026-02-01')).text();
    const onPage = [...html.matchAll(/<tr[^>]*><td>([^<]+)<\/td>/g)].map((m) => m[1]);
    expect(onPage).toEqual(json.rows.map((r) => r.job));
  });

  it('returns no rows for the empty night', async () => {
    const json = (await (await app().request('/api/digest/2026-02-02')).json()) as { rows: unknown[] };
    expect(json.rows).toEqual([]);
  });

  it('404s for a night with no file', async () => {
    expect((await app().request('/api/digest/2026-03-03')).status).toBe(404);
  });
});

describe('status board', () => {
  it('links each night to its digest with counts', async () => {
    const html = await (await app().request('/')).text();
    expect(html).toContain('href="/digest/2026-02-01"');
    expect(html).toContain('ok 1 · retry 3 · fail 1');
  });
});
