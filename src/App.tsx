import { useState, useEffect } from 'react';
import { SettingsProvider, useSettings } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';
import { Sidebar, type Page } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { MoneyLentPage } from './pages/MoneyLentPage';
import { SavingsPage } from './pages/SavingsPage';
import { ReportsPage } from './pages/ReportsPage';
import { BackupPage } from './pages/BackupPage';
import { SettingsPage } from './pages/SettingsPage';
import { OpeningBalanceModal } from './components/OpeningBalanceModal';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { loading, setupCompleted } = useSettings();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Show opening balance modal if setup not completed
  useEffect(() => {
    if (!loading && !setupCompleted) {
      setShowSetupModal(true);
    }
  }, [loading, setupCompleted]);

  // Show opening balance modal if setup not completed
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(page) => {
              setCurrentPage(page);
            }}
          />
        );
      case 'income':
        return <IncomePage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'money-lent':
        return <MoneyLentPage />;
      case 'savings':
        return <SavingsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'backup':
        return <BackupPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {showSetupModal && (
        <OpeningBalanceModal onComplete={() => setShowSetupModal(false)} />
      )}

      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <main className="lg:pl-64 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  );
}

export default App;
