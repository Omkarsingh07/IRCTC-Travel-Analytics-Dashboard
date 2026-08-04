import { useApp } from "../../context/AppContext";
import { X, Database, HardDrive, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DatabaseStatsModal() {
  const { isDbModalOpen, setIsDbModalOpen, summary } = useApp();

  if (!isDbModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-panel w-full max-w-lg rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-200 dark:border-slate-700/80 relative overflow-hidden space-y-6"
        >
          {/* Close button */}
          <button
            onClick={() => setIsDbModalOpen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                SQLite Database Diagnostics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Engine: backend/irctc.db • Schema Version 3.0
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Storage Engine
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">SQLite3 WAL Mode</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                Total Bookings Row Count
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {summary?.total_bookings || 0} rows
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                Refund Records Row Count
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                {summary?.cancelled_tickets || 0} rows
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Gmail Sync Strategy</p>
            <p className="text-slate-500 dark:text-slate-400">
              The engine stores `historyId` in `sync_metadata` table. Subsequent calls read lightweight header stubs before parsing HTML bodies, ensuring zero overhead.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DatabaseStatsModal;
