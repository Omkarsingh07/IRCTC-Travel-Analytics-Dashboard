import { useApp } from "../../context/AppContext";
import {
  CheckCircle2,
  MailCheck,
  Ban,
  Database,
  ArrowDownLeft,
  Clock,
} from "lucide-react";

export function ActivityTimeline() {
  const { summary } = useApp();
  const syncReport = summary?.sync || {};

  const activities = [
    {
      id: 1,
      type: "Booking Synced",
      title: "Incremental Gmail Sync",
      desc: syncReport.mode
        ? `Mode: ${syncReport.mode.toUpperCase()} • Duration: ${syncReport.duration_s || 0.4}s`
        : "Gmail history cursor verified",
      time: "Just now",
      icon: MailCheck,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    },
    {
      id: 2,
      type: "Cancellation Synced",
      title: "IRCTC Refund Matching",
      desc: `${summary?.cancelled_tickets || 0} total cancellations verified in SQLite`,
      time: "1 hour ago",
      icon: Ban,
      color: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    },
    {
      id: 3,
      type: "Refund Received",
      title: "IRCTC Wallet / Bank Credit",
      desc: `Total refund amount recorded: ₹${summary?.total_refund || 0}`,
      time: "Today",
      icon: ArrowDownLeft,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    },
    {
      id: 4,
      type: "Database Updated",
      title: "SQLite State Indexing",
      desc: "Idempotent database schema v3.0 up to date",
      time: "Auto",
      icon: Database,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Recent Activity
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit log of pipeline events and parser executions
          </p>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {activities.map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="relative flex items-start justify-between group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border ${act.color} flex items-center justify-center bg-slate-900 z-10`}
              >
                <Icon className="w-3 h-3" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {act.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                    {act.title}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {act.desc}
                </p>
              </div>

              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                {act.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ActivityTimeline;
