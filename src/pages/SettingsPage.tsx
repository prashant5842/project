import { useState } from 'react';
import { Sun, Moon, Globe, Loader2, Info } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { CURRENCIES } from '../utils/helpers';

export function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

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
