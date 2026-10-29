export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  // Owner of the job's last line; null when the log has none. Views show it as "—".
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  // The most recent error the job logged, even if the job ended ok.
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string;
  rows: DigestRow[];
  // Lines that did not parse. Counted, never thrown.
  badLines: number;
};

// Reads runs/<night>.jsonl. Returns null when the night has no file (the page answers 404).
export type ReadNight = (runsDir: string, night: string) => Night | null;
