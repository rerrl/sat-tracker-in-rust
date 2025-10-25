CREATE TABLE balance_change_events (
    id TEXT PRIMARY KEY,
    amount_sats INTEGER NOT NULL,
    value_cents INTEGER,
    event_type TEXT NOT NULL,
    memo TEXT,
    created_at TEXT NOT NULL
);
