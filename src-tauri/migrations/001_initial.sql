CREATE TABLE bitcoin_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'buy', 'sell'
    amount_sats INTEGER NOT NULL,
    subtotal_cents INTEGER, -- NULL for pure onchain fees
    fee_cents INTEGER, -- fiat fee amount (exchange fees, etc.)
    memo TEXT,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
