import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, HandCoins, PiggyBank, ArrowUpRight, ArrowDownRight, Loader2, Percent, Clock, DollarSign } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency, formatDate } from '../utils/helpers';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7',
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

interface DashboardProps {
  onNavigate: (page: 'income' | 'expenses') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { settings } = useSettings();
  const {
    totalBalance,
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
    activeInterestLoans,
    loading,
    error,
  } = useDashboard();

  const currency = settings?.currency || 'USD';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Current Balance', value: totalBalance, icon: TrendingUp, color: 'emerald' },
    { label: 'Total Income', value: totalIncome, icon: TrendingUp, color: 'blue' },
    { label: 'Total Expenses', value: totalExpenses, icon: TrendingDown, color: 'red' },
    { label: 'Total Savings', value: totalSavings, icon: PiggyBank, color: 'purple' },
    { label: 'Money Lent', value: moneyLent, icon: HandCoins, color: 'amber' },
    { label: 'Money Received', value: moneyReceived, icon: HandCoins, color: 'teal' },
    { label: 'Pending Amount', value: pendingAmount, icon: HandCoins, color: 'orange' },
  ];

  const interestMetrics = [
    { label: 'Principal Lent (Interest)', value: totalPrincipalLent, icon: HandCoins, color: 'amber' },
    { label: 'Monthly Interest Expected', value: monthlyInterestExpected, icon: Percent, color: 'blue' },
    { label: 'Interest Received This Month', value: interestReceivedThisMonth, icon: DollarSign, color: 'emerald' },
    { label: 'Pending Interest', value: pendingInterest, icon: Clock, color: 'red' },
    { label: 'Active Interest Loans', value: activeInterestLoans, icon: TrendingUp, color: 'purple', isCount: true },
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your financial health</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className={`rounded-xl border p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-gray-600 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg border ${colorClasses[metric.color]}`}>
                <metric.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm text-gray-400">{metric.label}</p>
              <p className={`text-xl font-semibold mt-1 ${metric.value < 0 ? 'text-red-400' : 'text-gray-100'}`}>
                {formatCurrency(metric.value, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Interest Loans Metrics */}
      {activeInterestLoans > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-100">Interest Loans Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {interestMetrics.map((metric, index) => (
              <div
                key={index}
                className={`rounded-xl border p-4 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-gray-600 transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg border ${colorClasses[metric.color]}`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className={`text-xl font-semibold mt-1 ${metric.value < 0 ? 'text-red-400' : 'text-gray-100'}`}>
                    {metric.isCount ? metric.value : formatCurrency(metric.value, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expense Trend */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Monthly Expense Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyExpenseData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => `${currency === 'USD' ? '$' : ''}${value}`} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#f3f4f6' }}
                  formatter={(value: number) => [formatCurrency(value, currency), 'Expenses']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Income vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} tickLine={false} tickFormatter={(value) => `${currency === 'USD' ? '$' : ''}${value}`} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                  itemStyle={{ color: '#f3f4f6' }}
                  formatter={(value: number) => formatCurrency(value, currency)}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) => <span className="text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No expenses this month
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-100">Recent Transactions</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('income')}
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                View Income
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                View Expenses
              </button>
            </div>
          </div>
          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={`${tx.type}-${tx.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {tx.description}
                        {tx.category && (
                          <span className="ml-2 text-xs text-gray-500">({tx.category})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No recent transactions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
