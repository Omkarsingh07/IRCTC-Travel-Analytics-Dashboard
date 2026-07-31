import { useApp } from "../../context/AppContext";
import { formatCurrency } from "../../utils/formatters";
import { Wallet, IndianRupee, Landmark, TrendingUp } from "lucide-react";
import AnimatedNumber from "../ui/AnimatedNumber";

export function RefundsView() {
  const { summary } = useApp();

  const totalCost = summary?.total_ticket_cost || 0;
  const refundAmount = summary?.total_refund || 0;
  const netSpent = summary?.net_amount_spent || 0;

  const refundPercent = totalCost > 0 ? ((refundAmount / totalCost) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-amber-500" />
          Financial & Refunds Ledger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete ledger of gross ticket expenses vs refunds returned.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Gross Ticket Fares</span>
            <IndianRupee className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            <AnimatedNumber value={totalCost} prefix="₹" decimals={2} />
          </div>
          <p className="text-xs text-slate-500">Sum of all active and cancelled ticket prices</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3 border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-amber-400">Total Refunded</span>
            <Wallet className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-500">
            <AnimatedNumber value={refundAmount} prefix="₹" decimals={2} />
          </div>
          <p className="text-xs text-slate-500">{refundPercent}% of total gross expenditure refunded</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3 border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-emerald-400">Net Spend</span>
            <Landmark className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-500">
            <AnimatedNumber value={netSpent} prefix="₹" decimals={2} />
          </div>
          <p className="text-xs text-slate-500">Actual money spent after subtracting refunds</p>
        </div>
      </div>
    </div>
  );
}

export default RefundsView;
