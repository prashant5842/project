-- Interest Loans table
CREATE TABLE IF NOT EXISTS interest_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_name text NOT NULL,
  phone_number text,
  principal_amount decimal(12,2) NOT NULL,
  loan_date date NOT NULL,
  principal_return_date date NOT NULL,
  monthly_interest_rate decimal(5,2) NOT NULL,
  interest_due_day integer NOT NULL DEFAULT 1,
  notes text DEFAULT '',
  total_interest_received decimal(12,2) NOT NULL DEFAULT 0,
  total_pending_interest decimal(12,2) NOT NULL DEFAULT 0,
  principal_returned boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interest_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_interest_loans" ON interest_loans;
CREATE POLICY "anon_crud_interest_loans" ON interest_loans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_interest_loans" ON interest_loans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_interest_loans" ON interest_loans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_interest_loans" ON interest_loans FOR DELETE TO anon, authenticated USING (true);

-- Interest payments table (tracks monthly interest payments)
CREATE TABLE IF NOT EXISTS interest_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_loan_id uuid NOT NULL REFERENCES interest_loans(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  due_amount decimal(12,2) NOT NULL,
  amount_received decimal(12,2) NOT NULL DEFAULT 0,
  pending_amount decimal(12,2) NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'Pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interest_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_interest_payments" ON interest_payments;
CREATE POLICY "anon_crud_interest_payments" ON interest_payments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_interest_payments" ON interest_payments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_interest_payments" ON interest_payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_interest_payments" ON interest_payments FOR DELETE TO anon, authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interest_loans_status ON interest_loans(status);
CREATE INDEX IF NOT EXISTS idx_interest_loans_principal_return ON interest_loans(principal_return_date);
CREATE INDEX IF NOT EXISTS idx_interest_payments_loan_id ON interest_payments(interest_loan_id);
CREATE INDEX IF NOT EXISTS idx_interest_payments_due_date ON interest_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_interest_payments_status ON interest_payments(status);
