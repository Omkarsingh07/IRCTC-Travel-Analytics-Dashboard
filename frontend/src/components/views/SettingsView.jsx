import { useTheme } from "../../context/ThemeContext";
import { useApp } from "../../context/AppContext";
import { Settings, Sun, Moon, Database, RefreshCw, CheckCircle2 } from "lucide-react";

export function SettingsView() {
  const { theme, toggleTheme } = useTheme();
  const { refreshDashboard, showToast } = useApp();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass-card p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          Dashboard Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize UI aesthetics, backend API host configuration, and local caching.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-6">
        {/* Appearance setting */}
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle between sleek dark mode and bright clean light mode.
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-semibold cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Backend API Host */}
        <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              FastAPI Endpoint Host
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Backend service address: http://127.0.0.1:8000
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        </div>

        {/* Clear cache */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reload Cached State
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Re-fetch SQLite data from backend endpoints.
            </p>
          </div>

          <button
            onClick={() => {
              refreshDashboard();
              showToast("Cache reloaded", "success");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
