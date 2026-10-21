-- Regent database schema: mandates, decisions, executions

CREATE TABLE IF NOT EXISTS mandates (
    id TEXT PRIMARY KEY,
    owner_address TEXT NOT NULL,
    smart_account_address TEXT,
    on_chain_id TEXT,
    goal TEXT NOT NULL,
    budget NUMERIC NOT NULL,
    spent NUMERIC NOT NULL DEFAULT 0,
    max_slippage NUMERIC NOT NULL,
    source_asset TEXT NOT NULL,
    target_asset TEXT NOT NULL,
    expiry TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    delegator_address TEXT,
    delegation_hash TEXT,
    delegation JSONB,
    tx_hash TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mandates_owner ON mandates(owner_address);
CREATE INDEX IF NOT EXISTS idx_mandates_smart_account ON mandates(smart_account_address);
CREATE INDEX IF NOT EXISTS idx_mandates_on_chain_id ON mandates(on_chain_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status ON mandates(status);

CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    mandate_id TEXT NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
    selected_route JSONB,
    reasoning TEXT,
    within_budget BOOLEAN,
    within_slippage BOOLEAN,
    all_routes JSONB,
    source TEXT,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_decisions_mandate ON decisions(mandate_id);

CREATE TABLE IF NOT EXISTS executions (
    id TEXT PRIMARY KEY,
    mandate_id TEXT NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL,
    transaction_hash TEXT,
    spent_amount NUMERIC NOT NULL,
    received_amount NUMERIC NOT NULL,
    fee_amount NUMERIC NOT NULL DEFAULT 0,
    error TEXT,
    task_id TEXT,
    source TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_executions_mandate ON executions(mandate_id);
