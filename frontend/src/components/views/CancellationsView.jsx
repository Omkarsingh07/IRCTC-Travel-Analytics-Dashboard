import { useApp } from "../../context/AppContext";
import StatCard from "../dashboard/StatCard";
import RecentTripsTable from "../dashboard/RecentTripsTable";
import { Ban, Wallet, IndianRupee } from "lucide-react";

export function CancellationsView() {
  const { summary } = useApp();

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Ban className="w-6 h-6 text-rose-500" />
          Cancellations & Refunds Breakdown
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed breakdown of cancelled train tickets matched against IRCTC cancellation emails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Cancelled Tickets"
          value={summary?.cancelled_tickets || 0}
          icon={Ban}
          iconGradient="from-rose-600 to-pink-600"
          glowColor="shadow-rose-500/20"
          subtitle="Total cancelled tickets"
        />

        <StatCard
          title="Total Refund Amount"
          value={summary?.total_refund || 0}
          isCurrency={true}
          icon={Wallet}
          iconGradient="from-emerald-600 to-teal-500"
          glowColor="glow-emerald"
          subtitle="Credited to bank / IRCTC Wallet"
        />

        <StatCard
          title="Total Ticket Cost"
          value={summary?.total_ticket_cost || 0}
          isCurrency={true}
          icon={IndianRupee}
          iconGradient="from-purple-600 to-indigo-600"
          glowColor="glow-purple"
          subtitle="Gross ticket bookings fare"
        />
      </div>

      {/* Cancelled Tickets Table */}
      <RecentTripsTable limit={15} />
    </div>
  );
}

export default CancellationsView;
