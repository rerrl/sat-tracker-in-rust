CREATE TABLE bitcoin_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'buy', 'sell', 'fee'
    amount_sats INTEGER NOT NULL,
    fiat_amount_cents INTEGER, -- NULL for pure bitcoin fees
    fee_sats INTEGER, -- bitcoin network fee or exchange fee in sats
    fee_fiat_cents INTEGER, -- fiat fee amount (exchange fees, etc.)
    memo TEXT,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
