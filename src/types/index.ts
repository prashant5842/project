export interface Income {
  id: string;
  date: string;
  source: string;
  amount: number;
  notes: string;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  payment_method: string;
  notes: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'Food'
  | 'Fuel'
  | 'Grocery'
  | 'Shopping'
  | 'Rent'
  | 'Medical'
  | 'Entertainment'
  | 'Travel'
  | 'Education'
  | 'Utilities'
  | 'Family'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Fuel',
  'Grocery',
  'Shopping',
  'Rent',
  'Medical',
  'Entertainment',
  'Travel',
  'Education',
  'Utilities',
  'Family',
  'Other',
];

export interface MoneyLent {
  id: string;
  person_name: string;
  amount_given: number;
  date_given: string;
  expected_return_date: string;
  amount_returned: number;
  remaining_balance: number;
  status: MoneyLentStatus;
  notes: string;
  created_at: string;
}

export type MoneyLentStatus = 'Pending' | 'Partial' | 'Paid';

export interface Repayment {
  id: string;
  money_lent_id: string;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  created_at: string;
}

export interface Settings {
  id: string;
  currency: string;
  theme: 'dark' | 'light';
  updated_at: string;
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReportFilters {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
}

// Interest Loan types
export interface InterestLoan {
  id: string;
  borrower_name: string;
  phone_number: string;
  principal_amount: number;
  loan_date: string;
  principal_return_date: string;
  monthly_interest_rate: number;
  interest_due_day: number;
  notes: string;
  total_interest_received: number;
  total_pending_interest: number;
  principal_returned: boolean;
  status: 'Active' | 'Closed';
  created_at: string;
}

export type InterestLoanStatus = 'Active' | 'Closed';

export interface InterestPayment {
  id: string;
  interest_loan_id: string;
  due_date: string;
  due_amount: number;
  amount_received: number;
  pending_amount: number;
  payment_date: string | null;
  status: 'Pending' | 'Partial' | 'Paid';
  notes: string;
  created_at: string;
}

export type InterestPaymentStatus = 'Pending' | 'Partial' | 'Paid';
