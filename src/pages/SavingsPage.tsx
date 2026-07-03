import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, PiggyBank, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/helpers';
import type { SavingsGoal } from '../types';

interface GoalFormData {
  name: string;
  target_amount: string;
  current_amount: string;
  deadline: string;
}

interface AddFundsData {
  amount: string;
}

const initialFormData: GoalFormData = {
  name: '',
  target_amount: '',
  current_amount: '0',
  deadline: '',
};

export function SavingsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal, addFunds } = useSavingsGoals();
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>(initialFormData);
  const [fundsData, setFundsData] = useState<AddFundsData>({ amount: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currency = settings?.currency || 'USD';

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length;

  const handleOpenModal = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount.toString(),
        current_amount: goal.current_amount.toString(),
        deadline: goal.deadline,
      });
    } else {
      setEditingGoal(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount || !formData.deadline) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        deadline: formData.deadline,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
        showToast('Goal updated successfully', 'success');
      } else {
        await addGoal(payload);
        showToast('Goal created successfully', 'success');
      }
      handleCloseModal();
    } catch {
      showToast('Failed to save goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddFunds = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setFundsData({ amount: '' });
    setAddFundsModalOpen(true);
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !fundsData.amount) return;

    setSaving(true);
    try {
      await addFunds(selectedGoal.id, parseFloat(fundsData.amount));
      showToast('Funds added successfully', 'success');
      setAddFundsModalOpen(false);
      setSelectedGoal(null);
    } catch {
      showToast('Failed to add funds', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGoal(id);
      showToast('Goal deleted successfully', 'success');
    } catch {
      showToast('Failed to delete goal', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getProgress = (goal: SavingsGoal) => {
    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
    return Math.min(progress, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Savings Goals</h1>
          <p className="text-gray-400 mt-1">Set and track your savings goals</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <PiggyBank className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-purple-300">Total Saved</p>
              <p className="text-xl font-bold text-purple-400">{formatCurrency(totalSaved, currency)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-300">Total Target</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(totalTarget, currency)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-emerald-300">Completed Goals</p>
              <p className="text-xl font-bold text-emerald-400">{completedGoals} / {goals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700">
          <PiggyBank className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No savings goals yet</p>
          <p className="text-gray-500 text-sm mt-2">Create your first goal to start tracking your savings</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = progress >= 100;
            const isOverdue = daysRemaining < 0 && !isCompleted;

            return (
              <div
                key={goal.id}
                className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border p-5 ${isCompleted ? 'border-emerald-500/30' : isOverdue ? 'border-red-500/30' : 'border-gray-700'} transition-all hover:border-gray-600`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100">{goal.name}</h3>
                    <p className={`text-sm mt-1 ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {isOverdue ? 'Overdue' : daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(goal)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(goal.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className={progress >= 100 ? 'text-emerald-400 font-semibold' : 'text-gray-300'}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Saved</p>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(Number(goal.current_amount), currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Target</p>
                    <p className="text-lg font-bold text-gray-300">{formatCurrency(Number(goal.target_amount), currency)}</p>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleOpenAddFunds(goal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                    Add Funds
                  </button>
                )}

                {isCompleted && (
                  <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                    Goal Completed!
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Deadline: {formatDate(goal.deadline)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGoal ? 'Edit Goal' : 'New Savings Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Goal Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Emergency Fund, Vacation"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Target Amount <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Current Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Deadline <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              required
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
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingGoal ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        isOpen={addFundsModalOpen}
        onClose={() => setAddFundsModalOpen(false)}
        title="Add Funds"
      >
        <form onSubmit={handleAddFunds} className="space-y-4">
          {selectedGoal && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">
                Goal: <span className="text-gray-100">{selectedGoal.name}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Current: <span className="text-emerald-400 font-medium">{formatCurrency(Number(selectedGoal.current_amount), currency)}</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Remaining: <span className="text-purple-400 font-medium">
                  {formatCurrency(Number(selectedGoal.target_amount) - Number(selectedGoal.current_amount), currency)}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Amount to Add <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={fundsData.amount}
              onChange={(e) => setFundsData({ amount: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setAddFundsModalOpen(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Funds
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Goal"
        message="Are you sure you want to delete this savings goal? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
