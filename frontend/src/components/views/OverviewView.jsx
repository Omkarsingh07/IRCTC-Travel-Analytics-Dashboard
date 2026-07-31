import HeroSection from "../dashboard/HeroSection";
import StatCardsGrid from "../dashboard/StatCardsGrid";
import AnalyticsCharts from "../dashboard/AnalyticsCharts";
import RecentTripsTable from "../dashboard/RecentTripsTable";
import ActivityTimeline from "../dashboard/ActivityTimeline";
import SyncStatusWidget from "../dashboard/SyncStatusWidget";

export function OverviewView() {
  return (
    <div className="space-y-8">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Stat Cards Grid (6 Cards) */}
      <StatCardsGrid />

      {/* 3. Recharts Analytics */}
      <AnalyticsCharts />

      {/* 4. Main Data Grid: Table + Side Widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <RecentTripsTable limit={8} />
        </div>

        <div className="space-y-8">
          <SyncStatusWidget />
          <ActivityTimeline />
        </div>
      </div>
    </div>
  );
}

export default OverviewView;
