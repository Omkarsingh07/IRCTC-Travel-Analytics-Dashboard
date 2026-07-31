import { motion } from "framer-motion";
import AnimatedNumber from "../ui/AnimatedNumber";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  title,
  value,
  isCurrency = false,
  icon: Icon,
  iconGradient = "from-blue-600 to-indigo-600",
  glowColor = "glow-blue",
  trend,
  trendUp = true,
  subtitle = "Compared to previous period",
}) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 group"
    >
      {/* Ambient background light */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all duration-500" />

      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            <AnimatedNumber
              value={value}
              prefix={isCurrency ? "₹" : ""}
              decimals={isCurrency ? 2 : 0}
            />
          </div>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${iconGradient} flex items-center justify-center text-white shadow-lg ${glowColor} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
        <div className="flex items-center gap-1 font-semibold">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                trendUp
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
        </div>
        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
}

export default StatCard;
