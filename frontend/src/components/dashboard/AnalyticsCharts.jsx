import { useApp } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatters";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, BarChart2, PieChart as PieIcon, Navigation } from "lucide-react";

const CLASS_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

export function AnalyticsCharts() {
  const { analytics } = useApp();

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="h-80 glass-card rounded-2xl animate-shimmer" />
        <div className="h-80 glass-card rounded-2xl animate-shimmer" />
      </div>
    );
  }

  const monthlyData = analytics.monthly_spend || [];
  const classData = analytics.class_distribution || [];
  const topRoutes = analytics.top_routes || [];
  const favoriteTrains = analytics.favorite_trains || [];

  // Custom tooltip for Monthly Spend
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl shadow-2xl border border-slate-700/80 text-xs">
          <p className="font-bold text-slate-200 mb-1">{label}</p>
          <p className="text-indigo-400 font-semibold">
            Spent: {formatCurrency(payload[0].value, 2)}
          </p>
          {payload[1] && (
            <p className="text-emerald-400 font-semibold">
              Trips: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Spending Trend */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Monthly Spending
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total money spent on tickets per month
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              INR (₹)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366F1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#spendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Trips Per Month Bar Chart */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-500" />
                Trips Per Month
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volume of train tickets booked per month
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Booking Count
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis
                  dataKey="month"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 3: Travel Class Breakdown Donut Chart */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-purple-500" />
                Class Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bookings by travel coach class
              </p>
            </div>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="travel_class"
                >
                  {classData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLASS_COLORS[index % CLASS_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val, name) => [`${val} tickets`, name]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend list */}
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {classData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CLASS_COLORS[idx % CLASS_COLORS.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.travel_class}
                  </span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Top Routes */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="w-5 h-5 text-cyan-500" />
                Most Travelled Routes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top station origin and destination pairs
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {topRoutes.slice(0, 5).map((route, index) => {
              const maxCount = topRoutes[0]?.count || 1;
              const percent = Math.round((route.count / maxCount) * 100);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
                        #{index + 1}
                      </span>
                      <span>{route.from_station}</span>
                      <span className="text-slate-400">→</span>
                      <span>{route.to_station}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {route.count} trips
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsCharts;
