import { useApp } from "../../context/AppContext";
import { exportBookingsToCSV } from "../../utils/exportCsv";
import { formatCurrency } from "../../utils/formatters";
import {
  Calendar,
  Clock,
  Train,
  RefreshCw,
  Download,
  Database,
  Sparkles,
  Zap,
} from "lucide-react";

export function HeroSection() {
  const { summary, bookingsData, triggerSync, refreshDashboard, isSyncing, setIsDbModalOpen } = useApp();

  const todayStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lastSyncTime = summary?.sync?.duration_s !== undefined
    ? `Completed in ${summary.sync.duration_s}s`
    : "Synced recently";

  const totalTrips = summary?.completed_trips || 0;
  const netSpent = formatCurrency(summary?.net_amount_spent || 0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 lg:p-8 text-white shadow-2xl">
      {/* Background ambient glow circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        {/* Title & Stats */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Travel Intelligence</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            Welcome back,
            <span className="block text-indigo-400 text-2xl lg:text-4xl font-semibold mt-1">
              IRCTC Travel Analytics
            </span>
          </h1>

          <p className="text-sm lg:text-base text-slate-300">
            Real-time breakdown of your Indian Railways bookings, ticket cancellations, refunds, and spend history.
          </p>

          {/* Details pill bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs lg:text-sm text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{todayStr}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Last Sync: {lastSyncTime}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <Train className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-white">{totalTrips} Completed Trips</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold backdrop-blur-md">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Net Spent: {netSpent}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0">
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs lg:text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Sync Gmail</span>
          </button>

          <button
            onClick={refreshDashboard}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs lg:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-indigo-300" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => exportBookingsToCSV(bookingsData?.bookings)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs lg:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs lg:text-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>DB Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
