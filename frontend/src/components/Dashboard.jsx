import { useApp } from "../context/AppContext";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import MobileNav from "./layout/MobileNav";
import OverviewView from "./views/OverviewView";
import BookingsView from "./views/BookingsView";
import CancellationsView from "./views/CancellationsView";
import RefundsView from "./views/RefundsView";
import AnalyticsView from "./views/AnalyticsView";
import SyncStatusView from "./views/SyncStatusView";
import SettingsView from "./views/SettingsView";
import BookingDetailModal from "./modals/BookingDetailModal";
import DatabaseStatsModal from "./modals/DatabaseStatsModal";
import Toast from "./ui/Toast";
import { Train } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const { activeTab, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl">
          <Train className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">IRCTC Travel Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading database insights and synchronization pipeline...</p>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (activeTab) {
      case "dashboard":
        return <OverviewView />;
      case "bookings":
        return <BookingsView />;
      case "cancellations":
        return <CancellationsView />;
      case "refunds":
        return <RefundsView />;
      case "analytics":
        return <AnalyticsView />;
      case "sync":
        return <SyncStatusView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar />

      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals & Toasts */}
      <BookingDetailModal />
      <DatabaseStatsModal />
      <Toast />
    </div>
  );
}

export default Dashboard;