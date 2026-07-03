import { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { FileDown, Loader2, Calendar, TrendingUp, TrendingDown, FileX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { ReportType, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from 'date-fns';

const COLORS = [
  '#ef4444', '#f59e0b', '#84cc16', '#ec4899', '#8b5cf6',
  '#6366f1', '#06b6d4', '#f97316', '#3b82f6', '#a855f7',
  '#14b8a6', '#64748b',
];

const categoryColors: Record<string, string> = {
  Food: '#ef4444',
  Fuel: '#f59e0b',
  Grocery: '#84cc16',
  Shopping: '#ec4899',
  Rent: '#8b5cf6',
  Medical: '#ef4444',
  Entertainment: '#6366f1',
  Travel: '#06b6d4',
  Education: '#3b82f6',
  Utilities: '#f97316',
  Family: '#a855f7',
  Other: '#64748b',
};

const reportTypes: { id: ReportType; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export function ReportsPage() {
  const { settings } = useSettings();
  const { showToast } = useToast();
  const currency = settings?.currency || 'USD';

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [incomesRes, expensesRes] = await Promise.all([
          supabase.from('incomes').select('*'),
          supabase.from('expenses').select('*'),
        ]);

        if (mounted) {
          setIncomes(incomesRes.data || []);
          setExpenses(expensesRes.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (mounted) {
          setIncomes([]);
          setExpenses([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = parseISO(startDate);
      end = parseISO(endDate);
    } else {
      switch (reportType) {
        case 'daily':
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case 'weekly':
          start = startOfWeek(now, { weekStartsOn: 1 });
          end = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'monthly':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'yearly':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
      }
    }

    return { start, end };
  }, [reportType, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      try {
        const expenseDate = parseISO(expense.date);
        const inRange = isWithinInterval(expenseDate, dateRange);
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        return inRange && matchesCategory;
      } catch {
        return false;
      }
    });
  }, [expenses, dateRange, categoryFilter]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter(income => {
      try {
        const incomeDate = parseISO(income.date);
        return isWithinInterval(incomeDate, dateRange);
      } catch {
        return false;
      }
    });
  }, [incomes, dateRange]);

  const totalIncome = filteredIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netSavings = totalIncome - totalExpenses;

  const spendingByCategory = useMemo(() => {
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const values = Object.values(categoryTotals) as number[];
    const total = values.reduce((sum, v) => sum + v, 0);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: amount as number,
        percentage: total > 0 ? ((amount as number) / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const trendData = useMemo(() => {
    const { start, end } = dateRange;

    try {
      let intervals: Date[];

      switch (reportType) {
        case 'daily':
          intervals = eachDayOfInterval({ start, end }).slice(0, 30);
          break;
        case 'weekly':
          intervals = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
          break;
        case 'monthly':
          intervals = eachMonthOfInterval({ start, end });
          break;
        case 'yearly':
          intervals = eachYearOfInterval({ start, end: new Date() });
          break;
        default:
          intervals = eachMonthOfInterval({ start, end });
      }

      return intervals.map(interval => {
        const rangeStart = reportType === 'daily' ? startOfDay(interval) : startOfMonth(interval);
        const rangeEnd = reportType === 'daily' ? endOfDay(interval) : endOfMonth(interval);

        const periodIncome = incomes.filter(i => {
          try {
            const d = parseISO(i.date);
            return d >= rangeStart && d <= rangeEnd;
          } catch {
            return false;
          }
        }).reduce((sum, i) => sum + Number(i.amount), 0);

        const periodExpenses = expenses.filter(e => {
          try {
            const d = parseISO(e.date);
            return d >= rangeStart && d <= rangeEnd;
          } catch {
            return false;
          }
        }).reduce((sum, e) => sum + Number(e.amount), 0);

        return {
          date: format(interval, reportType === 'daily' ? 'MMM dd' : reportType === 'monthly' || reportType === 'yearly' ? 'MMM yyyy' : 'MMM dd'),
          income: periodIncome,
          expenses: periodExpenses,
        };
      });
    } catch {
      return [];
    }
  }, [incomes, expenses, reportType, dateRange]);

  const topExpenses = useMemo(() => {
    return [...filteredExpenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [filteredExpenses]);

  const hasNoData = incomes.length === 0 && expenses.length === 0;

  const exportToCSV = () => {
    try {
      if (filteredExpenses.length === 0) {
        showToast('No data to export', 'warning');
        return;
      }

      let csv = 'Date,Category,Amount,Payment Method,Notes\n';
      filteredExpenses.forEach(e => {
        csv += `${e.date},${e.category},${e.amount},"${e.payment_method}","${e.notes || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `expense_report_${format(dateRange.start, 'yyyy-MM-dd')}_${format(dateRange.end, 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      showToast('Report exported successfully', 'success');
    } catch {
      showToast('Failed to export report', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Reports</h1>
          <p className="text-gray-400 mt-1">Analyze your financial data</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Report Type Toggle */}
          <div className="flex bg-gray-900/50 rounded-lg p-1">
            {reportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setReportType(type.id);
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  reportType === type.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | '')}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date Range Info */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-400">
            {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      ) : hasNoData ? (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-12 text-center">
          <FileX className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No transactions available.</p>
          <p className="text-gray-500 text-sm mt-2">Add income or expenses to view reports.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-300">Total Income</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-red-300">Total Expenses</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses, currency)}</p>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${netSavings >= 0 ? 'from-blue-600/20 to-indigo-600/20 border-blue-500/30' : 'from-amber-600/20 to-orange-600/20 border-amber-500/30'} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${netSavings >= 0 ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                  <TrendingUp className={`w-5 h-5 ${netSavings >= 0 ? 'text-blue-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <p className={`text-sm ${netSavings >= 0 ? 'text-blue-300' : 'text-amber-300'}`}>Net Savings</p>
                  <p className={`text-xl font-bold ${netSavings >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {formatCurrency(netSavings, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expense Trend */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Income vs Expenses Trend</h3>
              {trendData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => formatCurrency(Number(value), currency)}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No trend data for this period
                </div>
              )}
            </div>

            {/* Spending by Category */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Spending by Category</h3>
              {spendingByCategory.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {spendingByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={categoryColors[entry.category] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => formatCurrency(Number(value), currency)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No expense data for this period
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories Bar Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Expense Categories Breakdown</h3>
            {spendingByCategory.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis type="category" dataKey="category" stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {spendingByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={categoryColors[entry.category] || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No expense data for this period
              </div>
            )}
          </div>

          {/* Top Expenses */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Top 5 Expenses</h3>
            {topExpenses.length > 0 ? (
              <div className="space-y-2">
                {topExpenses.map((expense, index) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-800 text-sm font-medium text-gray-400">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-100">{expense.category}</p>
                        <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-red-400">{formatCurrency(Number(expense.amount), currency)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No expense records found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
