import { useState, type FormEvent } from 'react';
import { Sun, Moon, Globe, Loader2, Info, Wallet } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { CURRENCIES, formatCurrency } from '../utils/helpers';

export function SettingsPage() {
  const { settings, loading, updateSettings, currency } = useSettings();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(false);
  const [openingBalanceValue, setOpeningBalanceValue] = useState('');

  const handleThemeChange = async (theme: 'dark' | 'light') => {
    setSaving(true);
    try {
      await updateSettings({ theme });
      showToast('Theme updated', 'success');
    } catch {
      showToast('Failed to update theme', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setSaving(true);
    try {
      await updateSettings({ currency });
      showToast('Currency updated', 'success');
    } catch {
      showToast('Failed to update currency', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpeningBalanceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseFloat(openingBalanceValue);
    if (isNaN(value)) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({ opening_balance: value });
      showToast('Opening balance updated', 'success');
      setEditingOpeningBalance(false);
    } catch {
      showToast('Failed to update opening balance', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-1">Customize your experience</p>
      </div>

      {/* Opening Balance */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Opening Balance</h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-3">
              This is the starting balance for your account. It's used to calculate your current balance.
            </p>

            {editingOpeningBalance ? (
              <form onSubmit={handleOpeningBalanceSubmit} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingBalanceValue}
                    onChange={(e) => setOpeningBalanceValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOpeningBalance(false)}
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
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Current Opening Balance</p>
                    <p className="text-xl font-semibold text-gray-100">
                      {formatCurrency(settings?.opening_balance || 0, currency)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpeningBalanceValue((settings?.opening_balance || 0).toString());
                    setEditingOpeningBalance(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Info className="w-4 h-4" />
            <span>Current Balance = Opening Balance + Income - Expenses - Money Lent + Money Received</span>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Appearance</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('dark')}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all ${
                  settings?.theme === 'dark'
                    ? 'bg-gray-700/50 border-emerald-500/50 text-emerald-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="font-medium">Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                disabled={saving}
                className={`flex-1 flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all ${
                  settings?.theme === 'light'
                    ? 'bg-gray-700/50 border-emerald-500/50 text-emerald-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="font-medium">Light</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Currency</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Currency</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={settings?.currency || 'USD'}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={saving}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
            <Info className="w-4 h-4" />
            <span>Currency changes apply to all displays throughout the app</span>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">About</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p><strong className="text-gray-300">App:</strong> FinanceFlow - Personal Finance Manager</p>
          <p><strong className="text-gray-300">Version:</strong> 1.0.0</p>
          <p className="mt-4">
            Track your income, expenses, money lent to others, and savings goals all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}
