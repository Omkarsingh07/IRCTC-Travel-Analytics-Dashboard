import SyncStatusWidget from "../dashboard/SyncStatusWidget";
import ActivityTimeline from "../dashboard/ActivityTimeline";
import { RefreshCw } from "lucide-react";

export function SyncStatusView() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-emerald-500" />
          Gmail Sync Pipeline Engine
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Incremental sync engine specification, historyId cursor state, and metadata parsing logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SyncStatusWidget />
        <ActivityTimeline />
      </div>
    </div>
  );
}

export default SyncStatusView;
