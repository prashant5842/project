import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, subMonths, parseISO, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

interface DashboardData {
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  moneyLent: number;
  moneyReceived: number;
  pendingAmount: number;
  monthlyExpenseData: { date: string; amount: number }[];
  incomeVsExpenseData: { month: string; income: number; expenses: number }[];
  spendingByCategory: { category: string; amount: number; percentage: number }[];
  recentTransactions: RecentTransaction[];
  // Interest loan metrics
  totalPrincipalLent: number;
  monthlyInterestExpected: number;
  interestReceivedThisMonth: number;
  pendingInterest: number;
  activeInterestLoans: number;
  loading: boolean;
  error: string | null;
}

interface RecentTransaction {
  id: string;
  type: 'income' | 'expense';
  date: string;
  description: string;
  amount: number;
  category?: string;
}

const getEmptyDashboardData = (): DashboardData => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const last12Months = subMonths(now, 11);

  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const monthlyExpenseData = daysInMonth.map(day => ({
    date: format(day, 'MMM dd'),
    amount: 0,
  }));

  const months = eachMonthOfInterval({ start: last12Months, end: now });
  const incomeVsExpenseData = months.map(month => ({
    month: format(month, 'MMM yyyy'),
    income: 0,
    expenses: 0,
  }));

  return {
    openingBalance: 0,
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    moneyLent: 0,
    moneyReceived: 0,
    pendingAmount: 0,
    monthlyExpenseData,
    incomeVsExpenseData,
    spendingByCategory: [],
    recentTransactions: [],
    totalPrincipalLent: 0,
    monthlyInterestExpected: 0,
    interestReceivedThisMonth: 0,
    pendingInterest: 0,
    activeInterestLoans: 0,
    loading: false,
    error: null,
  };
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    ...getEmptyDashboardData(),
    loading: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const last12Months = subMonths(now, 11);

      // Fetch incomes with error handling
      let incomes: any[] = [];
      try {
        const { data: incomesData, error: incomesError } = await supabase
          .from('incomes')
          .select('*')
          .order('date', { ascending: false });
        if (!incomesError && incomesData) {
          incomes = incomesData;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch expenses with error handling
      let expenses: any[] = [];
      try {
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
        if (!expensesError && expensesData) {
          expenses = expensesData;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch money lent with error handling
      let moneyLentData: any[] = [];
      try {
        const { data: moneyLentResult, error: moneyLentError } = await supabase
          .from('money_lent')
          .select('*');
        if (!moneyLentError && moneyLentResult) {
          moneyLentData = moneyLentResult;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch savings goals with error handling
      let savingsGoals: any[] = [];
      try {
        const { data: savingsGoalsData, error: savingsError } = await supabase
          .from('savings_goals')
          .select('*');
        if (!savingsError && savingsGoalsData) {
          savingsGoals = savingsGoalsData;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch interest loans with error handling
      let interestLoans: any[] = [];
      try {
        const { data: interestLoansData, error: interestLoansError } = await supabase
          .from('interest_loans')
          .select('*');
        if (!interestLoansError && interestLoansData) {
          interestLoans = interestLoansData;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch interest payments with error handling
      let interestPayments: any[] = [];
      try {
        const { data: interestPaymentsData, error: interestPaymentsError } = await supabase
          .from('interest_payments')
          .select('*');
        if (!interestPaymentsError && interestPaymentsData) {
          interestPayments = interestPaymentsData;
        }
      } catch {
        // Gracefully handle - use empty array
      }

      // Fetch settings for opening balance
      let openingBalance = 0;
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('opening_balance')
          .maybeSingle();
        if (!settingsError && settingsData) {
          openingBalance = Number(settingsData.opening_balance) || 0;
        }
      } catch {
        // Gracefully handle - use 0
      }

      // Calculate totals
      const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalSavings = savingsGoals.reduce((sum, s) => sum + Number(s.current_amount), 0);
      const moneyLent = moneyLentData.reduce((sum, m) => sum + Number(m.amount_given), 0);
      const moneyReceived = moneyLentData.reduce((sum, m) => sum + Number(m.amount_returned), 0);
      const pendingAmount = moneyLentData.reduce((sum, m) => sum + Number(m.remaining_balance), 0);

      // Current balance = Opening Balance + Total Income - Total Expenses - Money Lent + Money Received
      const currentBalance = openingBalance + totalIncome - totalExpenses - moneyLent + moneyReceived;

      // Interest loan metrics
      const activeLoans = interestLoans.filter((l: any) => l.status === 'Active');
      const totalPrincipalLent = activeLoans.reduce((sum: number, l: any) => sum + Number(l.principal_amount), 0);
      const monthlyInterestExpected = activeLoans.reduce((sum: number, l: any) => {
        return sum + (Number(l.principal_amount) * Number(l.monthly_interest_rate)) / 100;
      }, 0);
      const pendingInterest = activeLoans.reduce((sum: number, l: any) => sum + Number(l.total_pending_interest), 0);

      // Interest received this month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const interestReceivedThisMonth = interestPayments
        .filter((p: any) => {
          const paymentDate = p.payment_date ? new Date(p.payment_date) : null;
          return paymentDate && paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, p: any) => sum + Number(p.amount_received), 0);

      // Monthly expense trend (current month)
      const currentMonthExpenses = expenses.filter((e: any) => {
        const date = parseISO(e.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      });

      const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
      const monthlyExpenseData = daysInMonth.map(day => {
        const dayExpenses = currentMonthExpenses.filter((e: any) => {
          const date = parseISO(e.date);
          return format(date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        });
        return {
          date: format(day, 'MMM dd'),
          amount: dayExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0),
        };
      });

      // Income vs Expense for last 12 months
      const months = eachMonthOfInterval({ start: last12Months, end: now });
      const incomeVsExpenseData = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthIncome = incomes.filter((i: any) => {
          const date = parseISO(i.date);
          return date >= monthStart && date <= monthEnd;
        }).reduce((sum: number, i: any) => sum + Number(i.amount), 0);

        const monthExpenses = expenses.filter((e: any) => {
          const date = parseISO(e.date);
          return date >= monthStart && date <= monthEnd;
        }).reduce((sum: number, e: any) => sum + Number(e.amount), 0);

        return {
          month: format(month, 'MMM yyyy'),
          income: monthIncome,
          expenses: monthExpenses,
        };
      });

      // Spending by category (current month)
      const categoryTotals = currentMonthExpenses.reduce((acc: Record<string, number>, e: any) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {} as Record<string, number>);

      const totalCategorySum = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
      const spendingByCategory = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalCategorySum > 0 ? (amount / totalCategorySum) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Recent transactions
      const recentIncomes = incomes.slice(0, 5).map((i: any) => ({
        id: i.id,
        type: 'income' as const,
        date: i.date,
        description: i.source,
        amount: Number(i.amount),
      }));

      const recentExpenses = expenses.slice(0, 5).map((e: any) => ({
        id: e.id,
        type: 'expense' as const,
        date: e.date,
        description: e.notes || e.category,
        amount: Number(e.amount),
        category: e.category,
      }));

      const recentTransactions = [...recentIncomes, ...recentExpenses]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setData({
        openingBalance,
        currentBalance,
        totalIncome,
        totalExpenses,
        totalSavings,
        moneyLent,
        moneyReceived,
        pendingAmount,
        monthlyExpenseData,
        incomeVsExpenseData,
        spendingByCategory,
        recentTransactions,
        totalPrincipalLent,
        monthlyInterestExpected,
        interestReceivedThisMonth,
        pendingInterest,
        activeInterestLoans: activeLoans.length,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fall back to empty data without showing error
      setData({
        ...getEmptyDashboardData(),
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refetch: fetchData };
}
