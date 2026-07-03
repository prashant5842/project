import { useState, type FormEvent } from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';

interface OpeningBalanceModalProps {
  onComplete: () => void;
}

export function OpeningBalanceModal({ onComplete }: OpeningBalanceModalProps) {
  const { updateSettings, currency } = useSettings();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const openingBalance = parseFloat(amount);
    if (isNaN(openingBalance)) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        opening_balance: openingBalance,
        setup_completed: true,
      });
      showToast('Opening balance saved successfully', 'success');
      onComplete();
    } catch {
      showToast('Failed to save opening balance', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Welcome to FinanceFlow</h2>
          <p className="text-gray-400 mt-2">
            Let's get started by setting your current account balance
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What is your current account balance?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'INR' ? '₹' : currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-2xl font-semibold text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-center"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This will be set as your Opening Balance. You can change this later in Settings.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || !amount}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              updateSettings({ opening_balance: 0, setup_completed: true });
              onComplete();
            }}
            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
