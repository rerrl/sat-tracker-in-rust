CREATE TABLE bitcoin_transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'buy', 'sell', 'onchain_fee'
    amount_sats INTEGER NOT NULL,
    fiat_amount_cents INTEGER, -- NULL for pure onchain fees
    fee_fiat_cents INTEGER, -- fiat fee amount (exchange fees, etc.)
    memo TEXT,
    timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- fiat_amount_cents is the total fiat amount of the transaction, including fees