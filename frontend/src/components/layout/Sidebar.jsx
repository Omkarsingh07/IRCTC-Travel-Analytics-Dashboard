import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Ticket,
  Ban,
  Wallet,
  BarChart3,
  RefreshCw,
  Settings,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const { activeTab, setActiveTab, summary } = useApp();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: Ticket,
      badge: summary?.total_bookings || 0,
      badgeColor: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    },
    {
      id: "cancellations",
      label: "Cancellations",
      icon: Ban,
      badge: summary?.cancelled_tickets || 0,
      badgeColor: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
    },
    {
      id: "refunds",
      label: "Refunds",
      icon: Wallet,
      badge: null,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "sync",
      label: "Sync Status",
      icon: RefreshCw,
      badge: "v3.0",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor || "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync status card bottom sidebar widget */}
        <div className="p-4 rounded-2xl glass-card border border-indigo-500/20 bg-gradient-to-b from-indigo-900/10 to-purple-900/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Pipeline Active
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Incremental history cursor stored in SQLite.
          </p>
          <button
            onClick={() => setActiveTab("sync")}
            className="w-full flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-300 font-semibold hover:underline"
          >
            <span>View Engine Specs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
