import AnalyticsCharts from "../dashboard/AnalyticsCharts";
import { BarChart3 } from "lucide-react";

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
          Advanced Analytics & Intelligence
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Visual breakdowns of spending trends, travel classes, top routes, and monthly booking frequency.
        </p>
      </div>

      <AnalyticsCharts />
    </div>
  );
}

export default AnalyticsView;
