import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

// Retries of 3 or more and any fail are marked. Text, not colour alone, so a screenshot and an
// agent's fetch say the same thing.
function flags(row: DigestRow): string[] {
  const out: string[] = [];
  if (row.retries >= 3) out.push(`${row.retries} retries`);
  if (row.lastStatus === 'fail') out.push('fail');
  return out;
}

export function DigestPage({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
              <th>flag</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => {
              const marked = flags(row);
              return (
                <tr class={marked.length ? 'warn' : undefined}>
                  <td>{row.job}</td>
                  <td>{row.owner ?? dash}</td>
                  <td>{row.runs}</td>
                  <td>{row.retries}</td>
                  <td>{row.lastStatus}</td>
                  <td>{row.lastError ?? dash}</td>
                  <td>{row.firstAt}</td>
                  <td>{row.lastAt}</td>
                  <td>{marked.length ? marked.join(', ') : dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {night.badLines > 0 && (
        <p class="mute">
          {night.badLines} {night.badLines === 1 ? 'line' : 'lines'} in the log could not be read.
        </p>
      )}
      <p>
        <a href="/">back to status</a>
      </p>
    </>
  );
}
