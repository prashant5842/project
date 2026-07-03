import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  HandCoins,
  PiggyBank,
  BarChart3,
  Settings,
  Database,
  Menu,
  X,
} from 'lucide-react';
import { classNames } from '../utils/helpers';

type Page = 'dashboard' | 'income' | 'expenses' | 'money-lent' | 'savings' | 'reports' | 'settings' | 'backup';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'income' as Page, label: 'Income', icon: TrendingUp },
  { id: 'expenses' as Page, label: 'Expenses', icon: TrendingDown },
  { id: 'money-lent' as Page, label: 'Money Lent', icon: HandCoins },
  { id: 'savings' as Page, label: 'Savings Goals', icon: PiggyBank },
  { id: 'reports' as Page, label: 'Reports', icon: BarChart3 },
  { id: 'backup' as Page, label: 'Backup', icon: Database },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
];

export function Sidebar({ currentPage, onNavigate, sidebarOpen, setSidebarOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed top-0 left-0 z-50 h-full w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">FinanceFlow</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={classNames(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  currentPage === item.id
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">Personal Finance Manager</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export type { Page };
