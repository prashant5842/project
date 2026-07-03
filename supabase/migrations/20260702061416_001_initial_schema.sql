/*
# Personal Finance Manager Schema

1. New Tables
- `incomes` - tracks all income entries
  - id (uuid, primary key)
  - date (date, not null)
  - source (text, not null)
  - amount (decimal, not null)
  - notes (text)
  - created_at (timestamp)

- `expenses` - tracks all expense entries
  - id (uuid, primary key)
  - date (date, not null)
  - category (text, not null)
  - amount (decimal, not null)
  - payment_method (text, not null)
  - notes (text)
  - created_at (timestamp)

- `money_lent` - tracks money given to others
  - id (uuid, primary key)
  - person_name (text, not null)
  - amount_given (decimal, not null)
  - date_given (date, not null)
  - expected_return_date (date, not null)
  - amount_returned (decimal, default 0)
  - remaining_balance (decimal, not null)
  - status (text, default 'Pending')
  - notes (text)
  - created_at (timestamp)

- `repayments` - tracks repayments for money lent
  - id (uuid, primary key)
  - money_lent_id (uuid, foreign key)
  - amount (decimal, not null)
  - date (date, not null)
  - notes (text)
  - created_at (timestamp)

- `savings_goals` - tracks savings goals
  - id (uuid, primary key)
  - name (text, not null)
  - target_amount (decimal, not null)
  - current_amount (decimal, default 0)
  - deadline (date, not null)
  - created_at (timestamp)

- `settings` - stores user preferences
  - id (uuid, primary key)
  - currency (text, default 'USD')
  - theme (text, default 'dark')
  - updated_at (timestamp)

2. Security
- RLS enabled on all tables
- All tables use anon + authenticated policies (single-tenant, no auth required)
*/

-- Incomes table
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  source text NOT NULL,
  amount decimal(12,2) NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_incomes" ON incomes;
CREATE POLICY "anon_crud_incomes" ON incomes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_incomes" ON incomes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_incomes" ON incomes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_incomes" ON incomes FOR DELETE TO anon, authenticated USING (true);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  category text NOT NULL,
  amount decimal(12,2) NOT NULL,
  payment_method text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_expenses" ON expenses;
CREATE POLICY "anon_crud_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- Money lent table
CREATE TABLE IF NOT EXISTS money_lent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  amount_given decimal(12,2) NOT NULL,
  date_given date NOT NULL,
  expected_return_date date NOT NULL,
  amount_returned decimal(12,2) NOT NULL DEFAULT 0,
  remaining_balance decimal(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE money_lent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_money_lent" ON money_lent;
CREATE POLICY "anon_crud_money_lent" ON money_lent FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_money_lent" ON money_lent FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_money_lent" ON money_lent FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_money_lent" ON money_lent FOR DELETE TO anon, authenticated USING (true);

-- Repayments table
CREATE TABLE IF NOT EXISTS repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  money_lent_id uuid NOT NULL REFERENCES money_lent(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  date date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_repayments" ON repayments;
CREATE POLICY "anon_crud_repayments" ON repayments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_repayments" ON repayments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_repayments" ON repayments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_repayments" ON repayments FOR DELETE TO anon, authenticated USING (true);

-- Savings goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount decimal(12,2) NOT NULL,
  current_amount decimal(12,2) NOT NULL DEFAULT 0,
  deadline date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_savings_goals" ON savings_goals;
CREATE POLICY "anon_crud_savings_goals" ON savings_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_savings_goals" ON savings_goals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_savings_goals" ON savings_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_savings_goals" ON savings_goals FOR DELETE TO anon, authenticated USING (true);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text NOT NULL DEFAULT 'USD',
  theme text NOT NULL DEFAULT 'dark',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_settings" ON settings;
CREATE POLICY "anon_crud_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_money_lent_status ON money_lent(status);
CREATE INDEX IF NOT EXISTS idx_money_lent_expected_return ON money_lent(expected_return_date);
CREATE INDEX IF NOT EXISTS idx_repayments_money_lent_id ON repayments(money_lent_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_deadline ON savings_goals(deadline);