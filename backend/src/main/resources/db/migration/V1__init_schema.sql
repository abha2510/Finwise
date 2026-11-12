CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- No password data: credentials live in Okta.
CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    okta_sub         VARCHAR(255) NOT NULL,
    email            VARCHAR(320),
    currency         CHAR(3)      NOT NULL DEFAULT 'INR',
    month_start_day  SMALLINT     NOT NULL DEFAULT 1 CHECK (month_start_day BETWEEN 1 AND 28),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_okta_sub UNIQUE (okta_sub)
);

CREATE TABLE accounts (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(100)  NOT NULL,
    type             VARCHAR(10)   NOT NULL CHECK (type IN ('BANK', 'CARD', 'CASH', 'WALLET')),
    opening_balance  NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_user ON accounts (user_id);

-- user_id NULL = default category shared by everyone
CREATE TABLE categories (
    id       BIGSERIAL PRIMARY KEY,
    user_id  BIGINT       REFERENCES users(id) ON DELETE CASCADE,
    name     VARCHAR(80)  NOT NULL,
    type     VARCHAR(10)  NOT NULL CHECK (type IN ('INCOME', 'EXPENSE'))
);
CREATE INDEX idx_categories_user ON categories (user_id);

CREATE TABLE transactions (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id   BIGINT        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id  BIGINT        REFERENCES categories(id) ON DELETE SET NULL,
    amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    type         VARCHAR(10)   NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    txn_date     DATE          NOT NULL,
    description  VARCHAR(500),
    merchant     VARCHAR(200),
    notes        VARCHAR(1000),
    tags         TEXT[]        NOT NULL DEFAULT '{}',
    -- SHA-256 of date + amount + normalized description + account; set by imports only
    hash         CHAR(64),
    raw_data     JSONB,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_transactions_user_hash UNIQUE (user_id, hash)
);
CREATE INDEX idx_txn_user_date     ON transactions (user_id, txn_date DESC);
CREATE INDEX idx_txn_user_cat_date ON transactions (user_id, category_id, txn_date);
CREATE INDEX idx_txn_merchant_trgm ON transactions USING GIN (merchant gin_trgm_ops);

CREATE TABLE budgets (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   BIGINT        NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month         DATE          NOT NULL, -- first day of the budget month
    limit_amount  NUMERIC(14,2) NOT NULL CHECK (limit_amount > 0),
    CONSTRAINT uq_budget UNIQUE (user_id, category_id, month)
);

CREATE TABLE goals (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(100)  NOT NULL,
    target_amount  NUMERIC(14,2) NOT NULL CHECK (target_amount > 0),
    saved_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
    target_date    DATE
);
CREATE INDEX idx_goals_user ON goals (user_id);

CREATE TABLE recurring_rules (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant   VARCHAR(200)  NOT NULL,
    amount     NUMERIC(14,2) NOT NULL,
    frequency  VARCHAR(10)   NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY')),
    next_due   DATE          NOT NULL,
    active     BOOLEAN       NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_recurring_user ON recurring_rules (user_id);

CREATE TABLE category_rules (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword      VARCHAR(200) NOT NULL,
    category_id  BIGINT       NOT NULL REFERENCES categories(id) ON DELETE CASCADE
);
CREATE INDEX idx_category_rules_user ON category_rules (user_id);

CREATE TABLE import_jobs (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name      VARCHAR(255) NOT NULL,
    status         VARCHAR(10)  NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'DONE', 'FAILED')),
    total_rows     INTEGER      NOT NULL DEFAULT 0,
    imported_rows  INTEGER      NOT NULL DEFAULT 0,
    skipped_rows   INTEGER      NOT NULL DEFAULT 0,
    error          VARCHAR(1000),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_jobs_user ON import_jobs (user_id);
