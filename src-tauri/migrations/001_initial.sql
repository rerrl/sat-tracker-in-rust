CREATE TABLE exchange_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'buy', 'sell'
    amount_sats INTEGER NOT NULL,
    subtotal_cents INTEGER, -- NULL for pure onchain fees
    fee_cents INTEGER, -- fiat fee amount (exchange fees, etc.)
    memo TEXT,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    provider_id TEXT, -- Add this field
    UNIQUE(provider_id) -- Add unique constraint, allows NULL for manual transactions
);

CREATE TABLE onchain_fees (
    id TEXT PRIMARY KEY,
    amount_sats INTEGER NOT NULL,
    memo TEXT,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tx_hash TEXT
);

-- Add timestamp indexes for efficient unified queries
CREATE INDEX idx_exchange_transactions_timestamp ON exchange_transactions(timestamp DESC);
CREATE INDEX idx_onchain_fees_timestamp ON onchain_fees(timestamp DESC);
