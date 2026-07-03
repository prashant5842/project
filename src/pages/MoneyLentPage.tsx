import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, HandCoins, AlertTriangle, History, DollarSign, Phone, Calendar, Percent, Clock, ChevronRight, X, Check } from 'lucide-react';
import { useMoneyLent } from '../hooks/useMoneyLent';
import { useInterestLoans } from '../hooks/useInterestLoans';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { MoneyLent, MoneyLentStatus, InterestLoan, InterestPayment } from '../types';

// Tab definitions
type TabType = 'normal' | 'interest';

// Normal Loan Form
interface MoneyLentFormData {
  person_name: string;
  amount_given: string;
  date_given: string;
  expected_return_date: string;
  notes: string;
}

interface RepaymentFormData {
  amount: string;
  date: string;
  notes: string;
}

// Interest Loan Form
interface InterestLoanFormData {
  borrower_name: string;
  phone_number: string;
  principal_amount: string;
  loan_date: string;
  principal_return_date: string;
  monthly_interest_rate: string;
  interest_due_day: string;
  notes: string;
}

interface InterestPaymentFormData {
  amount: string;
  payment_date: string;
  notes: string;
}

const initialFormData: MoneyLentFormData = {
  person_name: '',
  amount_given: '',
  date_given: new Date().toISOString().split('T')[0],
  expected_return_date: '',
  notes: '',
};

const initialRepaymentData: RepaymentFormData = {
  amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

const initialInterestLoanData: InterestLoanFormData = {
  borrower_name: '',
  phone_number: '',
  principal_amount: '',
  loan_date: new Date().toISOString().split('T')[0],
  principal_return_date: '',
  monthly_interest_rate: '',
  interest_due_day: '1',
  notes: '',
};

const initialInterestPaymentData: InterestPaymentFormData = {
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  notes: '',
};

const statusColors: Record<MoneyLentStatus, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Partial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const interestLoanStatusColors: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Closed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const interestPaymentStatusColors: Record<string, string> = {
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Partial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function MoneyLentPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('normal');

  // Normal loans
  const {
    moneyLentRecords,
    loading: normalLoading,
    addMoneyLent,
    updateMoneyLent,
    deleteMoneyLent,
    addRepayment,
    deleteRepayment,
    getRepaymentsForRecord,
  } = useMoneyLent();

  // Interest loans
  const {
    loans: interestLoans,
    loading: interestLoading,
    addLoan,
    updateLoan,
    deleteLoan,
    closeLoan,
    getPaymentsForLoan,
    recordPayment,
    deletePayment,
    getMetrics,
  } = useInterestLoans();

  const { settings } = useSettings();
  const { showToast } = useToast();

  const currency = settings?.currency || 'USD';

  // Normal loan modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MoneyLent | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MoneyLent | null>(null);
  const [formData, setFormData] = useState<MoneyLentFormData>(initialFormData);
  const [repaymentData, setRepaymentData] = useState<RepaymentFormData>(initialRepaymentData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MoneyLentStatus | ''>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteRepaymentConfirm, setDeleteRepaymentConfirm] = useState<{ id: string; moneyLentId: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Interest loan modal states
  const [interestLoanModalOpen, setInterestLoanModalOpen] = useState(false);
  const [editingInterestLoan, setEditingInterestLoan] = useState<InterestLoan | null>(null);
  const [interestLoanData, setInterestLoanData] = useState<InterestLoanFormData>(initialInterestLoanData);
  const [interestPaymentModalOpen, setInterestPaymentModalOpen] = useState(false);
  const [selectedInterestLoan, setSelectedInterestLoan] = useState<InterestLoan | null>(null);
  const [selectedPaymentForLoan, setSelectedPaymentForLoan] = useState<InterestPayment | null>(null);
  const [interestPaymentData, setInterestPaymentData] = useState<InterestPaymentFormData>(initialInterestPaymentData);
  const [interestLoanDetailModalOpen, setInterestLoanDetailModalOpen] = useState(false);
  const [deleteInterestLoanConfirm, setDeleteInterestLoanConfirm] = useState<string | null>(null);
  const [deleteInterestPaymentConfirm, setDeleteInterestPaymentConfirm] = useState<{ id: string; loanId: string } | null>(null);

  const loading = normalLoading || interestLoading;

  // Calculate metrics for interest loans
  const interestMetrics = getMetrics();

  // Normal loans filtered data
  const filteredRecords = moneyLentRecords.filter((record) => {
    const matchesSearch = record.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalLent = moneyLentRecords.reduce((sum, r) => sum + Number(r.amount_given), 0);
  const totalReceived = moneyLentRecords.reduce((sum, r) => sum + Number(r.amount_returned), 0);
  const totalPending = moneyLentRecords.reduce((sum, r) => sum + Number(r.remaining_balance), 0);

  const isOverdue = (record: MoneyLent) => {
    if (record.status === 'Paid') return false;
    const expectedDate = new Date(record.expected_return_date);
    return expectedDate < new Date();
  };

  // Interest loan helpers
  const calculateMonthlyInterest = (principal: number, rate: number): number => {
    return (principal * rate) / 100;
  };

  const getNextDueDate = (loan: InterestLoan): string => {
    const payments = getPaymentsForLoan(loan.id);
    const pendingPayments = payments.filter(p => p.status !== 'Paid').sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );
    return pendingPayments[0]?.due_date || 'N/A';
  };

  // Normal loan handlers
  const handleOpenModal = (record?: MoneyLent) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        person_name: record.person_name,
        amount_given: record.amount_given.toString(),
        date_given: record.date_given,
        expected_return_date: record.expected_return_date,
        notes: record.notes || '',
      });
    } else {
      setEditingRecord(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.person_name || !formData.amount_given || !formData.date_given || !formData.expected_return_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        person_name: formData.person_name,
        amount_given: parseFloat(formData.amount_given),
        date_given: formData.date_given,
        expected_return_date: formData.expected_return_date,
        notes: formData.notes,
      };

      if (editingRecord) {
        await updateMoneyLent(editingRecord.id, payload);
        showToast('Record updated successfully', 'success');
      } else {
        await addMoneyLent(payload);
        showToast('Record added successfully', 'success');
      }
      handleCloseModal();
    } catch {
      showToast('Failed to save record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRepaymentModal = (record: MoneyLent) => {
    setSelectedRecord(record);
    setRepaymentData(initialRepaymentData);
    setRepaymentModalOpen(true);
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !repaymentData.amount || !repaymentData.date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      await addRepayment({
        money_lent_id: selectedRecord.id,
        amount: parseFloat(repaymentData.amount),
        date: repaymentData.date,
        notes: repaymentData.notes,
      });
      showToast('Repayment recorded successfully', 'success');
      setRepaymentModalOpen(false);
      setSelectedRecord(null);
    } catch {
      showToast('Failed to record repayment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = (record: MoneyLent) => {
    setSelectedRecord(record);
    setHistoryModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMoneyLent(id);
      showToast('Record deleted successfully', 'success');
    } catch {
      showToast('Failed to delete record', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteRepayment = async (id: string, moneyLentId: string) => {
    try {
      await deleteRepayment(id, moneyLentId);
      showToast('Repayment deleted successfully', 'success');
      if (selectedRecord) {
        setHistoryModalOpen(false);
      }
    } catch {
      showToast('Failed to delete repayment', 'error');
    } finally {
      setDeleteRepaymentConfirm(null);
    }
  };

  // Interest loan handlers
  const handleOpenInterestLoanModal = (loan?: InterestLoan) => {
    if (loan) {
      setEditingInterestLoan(loan);
      setInterestLoanData({
        borrower_name: loan.borrower_name,
        phone_number: loan.phone_number || '',
        principal_amount: loan.principal_amount.toString(),
        loan_date: loan.loan_date,
        principal_return_date: loan.principal_return_date,
        monthly_interest_rate: loan.monthly_interest_rate.toString(),
        interest_due_day: loan.interest_due_day.toString(),
        notes: loan.notes || '',
      });
    } else {
      setEditingInterestLoan(null);
      setInterestLoanData(initialInterestLoanData);
    }
    setInterestLoanModalOpen(true);
  };

  const handleCloseInterestLoanModal = () => {
    setInterestLoanModalOpen(false);
    setEditingInterestLoan(null);
    setInterestLoanData(initialInterestLoanData);
  };

  const handleInterestLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestLoanData.borrower_name || !interestLoanData.principal_amount || !interestLoanData.loan_date ||
        !interestLoanData.principal_return_date || !interestLoanData.monthly_interest_rate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        borrower_name: interestLoanData.borrower_name,
        phone_number: interestLoanData.phone_number,
        principal_amount: parseFloat(interestLoanData.principal_amount),
        loan_date: interestLoanData.loan_date,
        principal_return_date: interestLoanData.principal_return_date,
        monthly_interest_rate: parseFloat(interestLoanData.monthly_interest_rate),
        interest_due_day: parseInt(interestLoanData.interest_due_day) || 1,
        notes: interestLoanData.notes,
      };

      if (editingInterestLoan) {
        await updateLoan(editingInterestLoan.id, payload);
        showToast('Loan updated successfully', 'success');
      } else {
        await addLoan(payload);
        showToast('Loan added successfully', 'success');
      }
      handleCloseInterestLoanModal();
    } catch {
      showToast('Failed to save loan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenInterestPaymentModal = (loan: InterestLoan, payment?: InterestPayment) => {
    setSelectedInterestLoan(loan);
    setSelectedPaymentForLoan(payment || null);
    setInterestPaymentData(initialInterestPaymentData);
    setInterestPaymentModalOpen(true);
  };

  const handleInterestPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterestLoan || !interestPaymentData.amount || !interestPaymentData.payment_date) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      await recordPayment({
        interest_loan_id: selectedInterestLoan.id,
        amount: parseFloat(interestPaymentData.amount),
        payment_date: interestPaymentData.payment_date,
        notes: interestPaymentData.notes,
      });
      showToast('Payment recorded successfully', 'success');
      setInterestPaymentModalOpen(false);
      setSelectedInterestLoan(null);
    } catch {
      showToast('Failed to record payment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenInterestLoanDetail = (loan: InterestLoan) => {
    setSelectedInterestLoan(loan);
    setInterestLoanDetailModalOpen(true);
  };

  const handleCloseInterestLoan = async (loanId: string) => {
    try {
      await closeLoan(loanId);
      showToast('Loan closed successfully', 'success');
      setInterestLoanDetailModalOpen(false);
    } catch {
      showToast('Failed to close loan', 'error');
    }
  };

  const handleDeleteInterestLoan = async (id: string) => {
    try {
      await deleteLoan(id);
      showToast('Loan deleted successfully', 'success');
    } catch {
      showToast('Failed to delete loan', 'error');
    } finally {
      setDeleteInterestLoanConfirm(null);
    }
  };

  const handleDeleteInterestPayment = async (id: string, loanId: string) => {
    try {
      await deletePayment(id, loanId);
      showToast('Payment deleted successfully', 'success');
    } catch {
      showToast('Failed to delete payment', 'error');
    } finally {
      setDeleteInterestPaymentConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Money Lent</h1>
          <p className="text-gray-400 mt-1">Track money given to friends and family</p>
        </div>
        <button
          onClick={() => activeTab === 'normal' ? handleOpenModal() : handleOpenInterestLoanModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'normal' ? 'Normal Loan' : 'Interest Loan'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800/50 rounded-lg p-1 border border-gray-700">
        <button
          onClick={() => setActiveTab('normal')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'normal'
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <HandCoins className="w-4 h-4 inline mr-2" />
          Normal Loans
        </button>
        <button
          onClick={() => setActiveTab('interest')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'interest'
              ? 'bg-amber-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Percent className="w-4 h-4 inline mr-2" />
          Interest Loans
        </button>
      </div>

      {/* Normal Loans Tab */}
      {activeTab === 'normal' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <HandCoins className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-300">Total Lent</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(totalLent, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-300">Total Received</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalReceived, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-red-300">Pending</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(totalPending, currency)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by person name or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MoneyLentStatus | '')}
              className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Person</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount Given</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Returned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pending</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date Given</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const overdue = isOverdue(record);
                      return (
                        <tr
                          key={record.id}
                          className={`hover:bg-gray-800/50 transition-colors ${overdue ? 'bg-red-900/10' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-100">{record.person_name}</span>
                              {overdue && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  Overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(Number(record.amount_given), currency)}</td>
                          <td className="px-4 py-3 text-sm text-emerald-400">{formatCurrency(Number(record.amount_returned), currency)}</td>
                          <td className="px-4 py-3 text-sm text-amber-400 font-medium">{formatCurrency(Number(record.remaining_balance), currency)}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(record.date_given)}</td>
                          <td className={`px-4 py-3 text-sm ${overdue ? 'text-red-400 font-medium' : 'text-gray-400'}`}>
                            {formatDate(record.expected_return_date)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${statusColors[record.status]}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {record.status !== 'Paid' && (
                                <button
                                  onClick={() => handleOpenRepaymentModal(record)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                  title="Add Repayment"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenHistory(record)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                title="View History"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenModal(record)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(record.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Interest Loans Tab */}
      {activeTab === 'interest' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <HandCoins className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-amber-300">Total Principal Lent</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(interestMetrics.totalPrincipalLent, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Percent className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-blue-300">Monthly Interest Expected</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(interestMetrics.monthlyInterestExpected, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-emerald-300">Interest Received This Month</p>
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(interestMetrics.interestReceivedThisMonth, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-red-300">Pending Interest</p>
                  <p className="text-xl font-bold text-red-400">{formatCurrency(interestMetrics.pendingInterest, currency)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-purple-300">Active Loans</p>
                  <p className="text-xl font-bold text-purple-400">{interestMetrics.activeLoansCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interest Loans List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : interestLoans.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500">
                No interest loans found. Click "Add Interest Loan" to create one.
              </div>
            ) : (
              interestLoans.map((loan) => {
                const monthlyInterest = calculateMonthlyInterest(Number(loan.principal_amount), Number(loan.monthly_interest_rate));
                const nextDueDate = getNextDueDate(loan);
                const payments = getPaymentsForLoan(loan.id);

                return (
                  <div
                    key={loan.id}
                    className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-100">{loan.borrower_name}</h3>
                        {loan.phone_number && (
                          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {loan.phone_number}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${interestLoanStatusColors[loan.status]}`}>
                        {loan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Principal Amount</p>
                        <p className="text-sm font-semibold text-gray-100">{formatCurrency(Number(loan.principal_amount), currency)}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Monthly Interest</p>
                        <p className="text-sm font-semibold text-blue-400">{formatCurrency(monthlyInterest, currency)}</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Interest Rate</p>
                        <p className="text-sm font-semibold text-gray-100">{loan.monthly_interest_rate}%</p>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Pending Interest</p>
                        <p className="text-sm font-semibold text-red-400">{formatCurrency(Number(loan.total_pending_interest), currency)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next Due: {nextDueDate !== 'N/A' ? formatDate(nextDueDate) : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Return: {formatDate(loan.principal_return_date)}
                      </span>
                    </div>

                    {/* Recent payments */}
                    {payments.length > 0 && (
                      <div className="mb-3 max-h-24 overflow-y-auto">
                        <p className="text-xs text-gray-500 mb-1">Recent Payments</p>
                        {payments.slice(0, 3).map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                            <span className="text-gray-400">{formatDate(payment.due_date)}</span>
                            <span className="text-gray-500">Due: {formatCurrency(Number(payment.due_amount), currency)}</span>
                            <span className={`${
                              payment.status === 'Paid' ? 'text-emerald-400' : payment.status === 'Partial' ? 'text-blue-400' : 'text-amber-400'
                            }`}>
                              {formatCurrency(Number(payment.amount_received), currency)} / {payment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <button
                        onClick={() => handleOpenInterestLoanDetail(loan)}
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        View Details <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {loan.status === 'Active' && (
                          <button
                            onClick={() => handleOpenInterestPaymentModal(loan)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Receive Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenInterestLoanModal(loan)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteInterestLoanConfirm(loan.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Upcoming Due Payments */}
          {interestMetrics.upcomingDuePayments.length > 0 && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-3">Upcoming Due Payments</h3>
              <div className="space-y-2">
                {interestMetrics.upcomingDuePayments.map((payment) => {
                  const loan = interestLoans.find(l => l.id === payment.interest_loan_id);
                  if (!loan) return null;

                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-100">{loan.borrower_name}</p>
                        <p className="text-xs text-gray-400">Due: {formatDate(payment.due_date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-amber-400">{formatCurrency(Number(payment.pending_amount), currency)}</p>
                          <p className="text-xs text-gray-500">pending</p>
                        </div>
                        <button
                          onClick={() => handleOpenInterestPaymentModal(loan, payment)}
                          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                          Receive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Normal Loan Modals */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRecord ? 'Edit Record' : 'Add Money Lent'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Person Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.person_name}
              onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Amount Given <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount_given}
                onChange={(e) => setFormData({ ...formData, amount_given: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Date Given <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.date_given}
                onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Expected Return Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.expected_return_date}
              onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingRecord ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Repayment Modal */}
      <Modal
        isOpen={repaymentModalOpen}
        onClose={() => setRepaymentModalOpen(false)}
        title="Record Repayment"
      >
        <form onSubmit={handleRepaymentSubmit} className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Person: <span className="text-gray-100">{selectedRecord.person_name}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Remaining: <span className="text-amber-400 font-medium">{formatCurrency(Number(selectedRecord.remaining_balance), currency)}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Repayment Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={selectedRecord ? Number(selectedRecord.remaining_balance) : undefined}
                value={repaymentData.amount}
                onChange={(e) => setRepaymentData({ ...repaymentData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={repaymentData.date}
                onChange={(e) => setRepaymentData({ ...repaymentData, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={repaymentData.notes}
              onChange={(e) => setRepaymentData({ ...repaymentData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setRepaymentModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Repayment History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Repayment History"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-100">{selectedRecord.person_name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Given: {formatDate(selectedRecord.date_given)} | Due: {formatDate(selectedRecord.expected_return_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(Number(selectedRecord.remaining_balance), currency)}</p>
                  <p className="text-xs text-gray-500">remaining</p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(Number(selectedRecord.amount_returned) / Number(selectedRecord.amount_given)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Repayments</h4>
              {getRepaymentsForRecord(selectedRecord.id).length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No repayments yet</p>
              ) : (
                getRepaymentsForRecord(selectedRecord.id).map((repayment) => (
                  <div
                    key={repayment.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-emerald-400">{formatCurrency(Number(repayment.amount), currency)}</p>
                      <p className="text-xs text-gray-500">{formatDate(repayment.date)}{repayment.notes && ` - ${repayment.notes}`}</p>
                    </div>
                    <button
                      onClick={() => setDeleteRepaymentConfirm({ id: repayment.id, moneyLentId: selectedRecord.id })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Interest Loan Modal */}
      <Modal
        isOpen={interestLoanModalOpen}
        onClose={handleCloseInterestLoanModal}
        title={editingInterestLoan ? 'Edit Interest Loan' : 'Add Interest Loan'}
        size="lg"
      >
        <form onSubmit={handleInterestLoanSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Borrower's Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={interestLoanData.borrower_name}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, borrower_name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={interestLoanData.phone_number}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, phone_number: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Principal Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={interestLoanData.principal_amount}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, principal_amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Loan Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={interestLoanData.loan_date}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, loan_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Principal Return Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={interestLoanData.principal_return_date}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, principal_return_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Interest Due Day (1-31) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={interestLoanData.interest_due_day}
                onChange={(e) => setInterestLoanData({ ...interestLoanData, interest_due_day: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Monthly Interest Rate (%) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={interestLoanData.monthly_interest_rate}
              onChange={(e) => setInterestLoanData({ ...interestLoanData, monthly_interest_rate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            />
            {interestLoanData.principal_amount && interestLoanData.monthly_interest_rate && (
              <p className="text-sm text-blue-400 mt-2">
                Monthly Interest Amount: {formatCurrency(
                  calculateMonthlyInterest(parseFloat(interestLoanData.principal_amount) || 0, parseFloat(interestLoanData.monthly_interest_rate) || 0),
                  currency
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={interestLoanData.notes}
              onChange={(e) => setInterestLoanData({ ...interestLoanData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseInterestLoanModal}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingInterestLoan ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Interest Payment Modal */}
      <Modal
        isOpen={interestPaymentModalOpen}
        onClose={() => setInterestPaymentModalOpen(false)}
        title="Receive Interest Payment"
      >
        <form onSubmit={handleInterestPaymentSubmit} className="space-y-4">
          {selectedInterestLoan && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Borrower: <span className="text-gray-100">{selectedInterestLoan.borrower_name}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Principal: <span className="text-amber-400 font-medium">{formatCurrency(Number(selectedInterestLoan.principal_amount), currency)}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Monthly Interest: <span className="text-blue-400 font-medium">
                  {formatCurrency(calculateMonthlyInterest(Number(selectedInterestLoan.principal_amount), Number(selectedInterestLoan.monthly_interest_rate)), currency)}
                </span>
              </p>
              {selectedPaymentForLoan && (
                <p className="text-sm text-gray-400 mt-1">
                  Due Amount: <span className="text-gray-100">{formatCurrency(Number(selectedPaymentForLoan.pending_amount), currency)}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Amount Received <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={interestPaymentData.amount}
                onChange={(e) => setInterestPaymentData({ ...interestPaymentData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Payment Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={interestPaymentData.payment_date}
                onChange={(e) => setInterestPaymentData({ ...interestPaymentData, payment_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
            <textarea
              value={interestPaymentData.notes}
              onChange={(e) => setInterestPaymentData({ ...interestPaymentData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setInterestPaymentModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Receive Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Interest Loan Detail Modal */}
      <Modal
        isOpen={interestLoanDetailModalOpen}
        onClose={() => setInterestLoanDetailModalOpen(false)}
        title="Loan Details"
        size="lg"
      >
        {selectedInterestLoan && (
          <div className="space-y-4">
            {/* Borrower Info */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-lg text-gray-100">{selectedInterestLoan.borrower_name}</p>
                  {selectedInterestLoan.phone_number && (
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {selectedInterestLoan.phone_number}
                    </p>
                  )}
                  {selectedInterestLoan.notes && (
                    <p className="text-sm text-gray-500 mt-2">{selectedInterestLoan.notes}</p>
                  )}
                </div>
                <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border ${interestLoanStatusColors[selectedInterestLoan.status]}`}>
                  {selectedInterestLoan.status}
                </span>
              </div>
            </div>

            {/* Loan Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Principal Amount</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(Number(selectedInterestLoan.principal_amount), currency)}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Monthly Interest</p>
                <p className="text-xl font-bold text-blue-400">
                  {formatCurrency(calculateMonthlyInterest(Number(selectedInterestLoan.principal_amount), Number(selectedInterestLoan.monthly_interest_rate)), currency)}
                </p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Interest Rate</p>
                <p className="text-lg font-semibold text-gray-100">{selectedInterestLoan.monthly_interest_rate}% per month</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Interest Due Day</p>
                <p className="text-lg font-semibold text-gray-100">{selectedInterestLoan.interest_due_day}th of every month</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Loan Date</p>
                <p className="text-lg font-semibold text-gray-100">{formatDate(selectedInterestLoan.loan_date)}</p>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Principal Return Date</p>
                <p className="text-lg font-semibold text-gray-100">{formatDate(selectedInterestLoan.principal_return_date)}</p>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                <p className="text-xs text-emerald-300">Total Interest Received</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(Number(selectedInterestLoan.total_interest_received), currency)}</p>
              </div>
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                <p className="text-xs text-red-300">Pending Interest</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(Number(selectedInterestLoan.total_pending_interest), currency)}</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">Principal Returned</p>
                <p className="text-lg font-bold text-gray-100">
                  {selectedInterestLoan.principal_returned ? <Check className="w-6 h-6 text-emerald-400" /> : <X className="w-6 h-6 text-gray-500" />}
                </p>
              </div>
            </div>

            {/* Interest Payment History */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-300">Interest Payment History</h4>
                {selectedInterestLoan.status === 'Active' && (
                  <button
                    onClick={() => {
                      setInterestLoanDetailModalOpen(false);
                      setTimeout(() => handleOpenInterestPaymentModal(selectedInterestLoan), 100);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    + Receive Payment
                  </button>
                )}
              </div>
              {getPaymentsForLoan(selectedInterestLoan.id).length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No interest payments yet</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {getPaymentsForLoan(selectedInterestLoan.id).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-100">{formatDate(payment.due_date)}</p>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${interestPaymentStatusColors[payment.status]}`}>
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {formatCurrency(Number(payment.due_amount), currency)} |
                          Received: {formatCurrency(Number(payment.amount_received), currency)} |
                          Pending: {formatCurrency(Number(payment.pending_amount), currency)}
                        </p>
                        {payment.payment_date && (
                          <p className="text-xs text-gray-500">Paid on: {formatDate(payment.payment_date)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {payment.status !== 'Paid' && (
                          <button
                            onClick={() => {
                              setInterestLoanDetailModalOpen(false);
                              setTimeout(() => handleOpenInterestPaymentModal(selectedInterestLoan!, payment), 100);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Receive Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteInterestPaymentConfirm({ id: payment.id, loanId: selectedInterestLoan.id })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedInterestLoan.status === 'Active' && (
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleCloseInterestLoan(selectedInterestLoan.id)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Close Loan
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmations */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Record"
        message="Are you sure you want to delete this record? All associated repayments will also be deleted."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteRepaymentConfirm}
        title="Delete Repayment"
        message="Are you sure you want to delete this repayment? The remaining balance will be recalculated."
        confirmLabel="Delete"
        onConfirm={() => deleteRepaymentConfirm && handleDeleteRepayment(deleteRepaymentConfirm.id, deleteRepaymentConfirm.moneyLentId)}
        onCancel={() => setDeleteRepaymentConfirm(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteInterestLoanConfirm}
        title="Delete Interest Loan"
        message="Are you sure you want to delete this interest loan? All associated interest payments will also be deleted."
        confirmLabel="Delete"
        onConfirm={() => deleteInterestLoanConfirm && handleDeleteInterestLoan(deleteInterestLoanConfirm)}
        onCancel={() => setDeleteInterestLoanConfirm(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteInterestPaymentConfirm}
        title="Delete Interest Payment"
        message="Are you sure you want to delete this interest payment?"
        confirmLabel="Delete"
        onConfirm={() => deleteInterestPaymentConfirm && handleDeleteInterestPayment(deleteInterestPaymentConfirm.id, deleteInterestPaymentConfirm.loanId)}
        onCancel={() => setDeleteInterestPaymentConfirm(null)}
      />
    </div>
  );
}
