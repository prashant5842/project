import { useState, useRef, type ChangeEvent } from 'react';
import { Download, Upload, Trash2, Loader2, FileJson } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface BackupData {
  incomes: any[];
  expenses: any[];
  money_lent: any[];
  repayments: any[];
  savings_goals: any[];
  interest_loans: any[];
  interest_payments: any[];
  settings: any[];
  exportDate: string;
  version: string;
}

export function BackupPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const [incomes, expenses, moneyLent, repayments, savingsGoals, interestLoans, interestPayments, settings] = await Promise.all([
        supabase.from('incomes').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('money_lent').select('*'),
        supabase.from('repayments').select('*'),
        supabase.from('savings_goals').select('*'),
        supabase.from('interest_loans').select('*'),
        supabase.from('interest_payments').select('*'),
        supabase.from('settings').select('*'),
      ]);

      const backupData: BackupData = {
        incomes: incomes.data || [],
        expenses: expenses.data || [],
        money_lent: moneyLent.data || [],
        repayments: repayments.data || [],
        savings_goals: savingsGoals.data || [],
        interest_loans: interestLoans.data || [],
        interest_payments: interestPayments.data || [],
        settings: settings.data || [],
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export data', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      // Validate structure
      if (!data.version || !data.exportDate) {
        showToast('Invalid backup file format', 'error');
        return;
      }

      // Clear existing data before import
      await Promise.all([
        supabase.from('incomes').delete().neq('id', 0),
        supabase.from('expenses').delete().neq('id', 0),
        supabase.from('repayments').delete().neq('id', 0),
        supabase.from('money_lent').delete().neq('id', 0),
        supabase.from('savings_goals').delete().neq('id', 0),
        supabase.from('interest_loans').delete().neq('id', 0),
        supabase.from('interest_payments').delete().neq('id', 0),
      ]);

      // Insert new data
      if (data.incomes?.length > 0) {
        await supabase.from('incomes').insert(data.incomes);
      }
      if (data.expenses?.length > 0) {
        await supabase.from('expenses').insert(data.expenses);
      }
      if (data.money_lent?.length > 0) {
        await supabase.from('money_lent').insert(data.money_lent);
      }
      if (data.repayments?.length > 0) {
        await supabase.from('repayments').insert(data.repayments);
      }
      if (data.savings_goals?.length > 0) {
        await supabase.from('savings_goals').insert(data.savings_goals);
      }
      if (data.interest_loans?.length > 0) {
        await supabase.from('interest_loans').insert(data.interest_loans);
      }
      if (data.interest_payments?.length > 0) {
        await supabase.from('interest_payments').insert(data.interest_payments);
      }

      showToast('Data imported successfully', 'success');
    } catch (error) {
      console.error('Import error:', error);
      showToast('Failed to import data. Invalid file format.', 'error');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await Promise.all([
        supabase.from('incomes').delete().neq('id', 0),
        supabase.from('expenses').delete().neq('id', 0),
        supabase.from('repayments').delete().neq('id', 0),
        supabase.from('money_lent').delete().neq('id', 0),
        supabase.from('savings_goals').delete().neq('id', 0),
        supabase.from('interest_loans').delete().neq('id', 0),
        supabase.from('interest_payments').delete().neq('id', 0),
      ]);

      showToast('All data has been reset', 'success');
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Reset error:', error);
      showToast('Failed to reset data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Backup & Restore</h1>
        <p className="text-gray-400 mt-1">Export, import, or reset your financial data</p>
      </div>

      {/* Export Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Download className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100">Export Data</h3>
            <p className="text-sm text-gray-400 mt-1">
              Download all your financial data as a JSON file. This includes income, expenses, money lent, savings goals, and settings.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export JSON
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Upload className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100">Import Data</h3>
            <p className="text-sm text-gray-400 mt-1">
              Restore your data from a previously exported JSON backup file. This will replace all existing data.
            </p>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import JSON
                  </>
                )}
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-100">Reset All Data</h3>
            <p className="text-sm text-gray-400 mt-1">
              Permanently delete all your financial data. This action cannot be undone. Make sure to export your data first.
            </p>
            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={resetting}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <FileJson className="w-6 h-6 text-gray-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-100">About Backups</h4>
            <ul className="mt-2 text-sm text-gray-400 space-y-1">
              <li>Your data is securely stored in Supabase</li>
              <li>Export your data regularly to keep a local backup</li>
              <li>Import backups will replace all current data</li>
              <li>Settings are preserved in backups</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Data"
        message="This will permanently delete all your income, expenses, money lent, and savings goal records. This action cannot be undone. Are you sure?"
        confirmLabel="Reset Everything"
        variant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
