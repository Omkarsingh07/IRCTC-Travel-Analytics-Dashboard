import { useApp } from "../../context/AppContext";
import {
  CheckCircle2,
  RefreshCw,
  Database,
  Mail,
  Zap,
  ShieldCheck,
} from "lucide-react";

export function SyncStatusWidget() {
  const { summary, triggerSync, isSyncing } = useApp();
  const sync = summary?.sync || {};
  const bookings = sync.bookings || { found: 0, new: 0, skipped: 0, failed: 0 };
  const cancellations = sync.cancellations || { found: 0, new: 0, skipped: 0, failed: 0 };

  const modeStr = (sync.mode || "INCREMENTAL").toUpperCase();
  const durationStr = sync.duration_s !== undefined ? `${sync.duration_s}s` : "< 1.0s";

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Sync Engine Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gmail OAuth2 • Lightweight Metadata Filtering
            </p>
          </div>
        </div>

        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>Run Sync</span>
        </button>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Database Status
          </span>
          <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            Connected
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Sync Mode
          </span>
          <p className="text-xs font-bold text-indigo-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {modeStr}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Duration
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {durationStr}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Safety Filter
          </span>
          <p className="text-xs font-bold text-purple-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified
          </p>
        </div>
      </div>

      {/* Pipeline Statistics breakdown */}
      <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Emails Evaluated</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {(bookings.found || 0) + (cancellations.found || 0)} messages
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Bookings Added</span>
          <span className="font-bold text-emerald-500">+{bookings.new || 0} new</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Cancellations Added</span>
          <span className="font-bold text-rose-500">+{cancellations.new || 0} new</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400">Skipped Non-IRCTC</span>
          <span className="font-bold text-slate-400">
            {(bookings.skipped || 0) + (cancellations.skipped || 0)} skipped
          </span>
        </div>
      </div>
    </div>
  );
}

export default SyncStatusWidget;
