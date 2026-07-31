import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard,
  Ticket,
  Ban,
  Wallet,
  BarChart3,
  RefreshCw,
  Settings,
} from "lucide-react";

export function MobileNav() {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "bookings", label: "Bookings", icon: Ticket },
    { id: "cancellations", label: "Cancel", icon: Ban },
    { id: "refunds", label: "Refunds", icon: Wallet },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "sync", label: "Sync", icon: RefreshCw },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400 font-bold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileNav;
