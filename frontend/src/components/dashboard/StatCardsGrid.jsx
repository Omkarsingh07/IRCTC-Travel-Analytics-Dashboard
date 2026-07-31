import { useApp } from "../../context/AppContext";
import StatCard from "./StatCard";
import {
  Train,
  Ban,
  CheckCircle2,
  IndianRupee,
  Wallet,
  Landmark,
} from "lucide-react";

export function StatCardsGrid() {
  const { summary } = useApp();

  if (!summary) return null;

  const cancellationRate = summary.total_bookings > 0
    ? ((summary.cancelled_tickets / summary.total_bookings) * 100).toFixed(1)
    : 0;

  const refundRate = summary.total_ticket_cost > 0
    ? ((summary.total_refund / summary.total_ticket_cost) * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatCard
        title="Total Bookings"
        value={summary.total_bookings}
        icon={Train}
        iconGradient="from-blue-600 to-cyan-500"
        glowColor="glow-blue"
        trend="↑ 100%"
        trendUp={true}
        subtitle="All synced IRCTC tickets"
      />

      <StatCard
        title="Cancelled Tickets"
        value={summary.cancelled_tickets}
        icon={Ban}
        iconGradient="from-rose-600 to-pink-500"
        glowColor="shadow-rose-500/20"
        trend={`${cancellationRate}%`}
        trendUp={false}
        subtitle="Cancellation percentage"
      />

      <StatCard
        title="Completed Trips"
        value={summary.completed_trips}
        icon={CheckCircle2}
        iconGradient="from-emerald-600 to-teal-500"
        glowColor="glow-emerald"
        trend="↑ Active"
        trendUp={true}
        subtitle="Verified completed travel"
      />

      <StatCard
        title="Total Ticket Cost"
        value={summary.total_ticket_cost}
        isCurrency={true}
        icon={IndianRupee}
        iconGradient="from-purple-600 to-indigo-600"
        glowColor="glow-purple"
        trend="Gross"
        trendUp={true}
        subtitle="Sum of all ticket fares"
      />

      <StatCard
        title="Total Refund"
        value={summary.total_refund}
        isCurrency={true}
        icon={Wallet}
        iconGradient="from-amber-500 to-orange-500"
        glowColor="shadow-amber-500/20"
        trend={`${refundRate}%`}
        trendUp={true}
        subtitle="Credited back from cancellations"
      />

      <StatCard
        title="Net Amount Spent"
        value={summary.net_amount_spent}
        isCurrency={true}
        icon={Landmark}
        iconGradient="from-emerald-500 to-cyan-600"
        glowColor="glow-emerald"
        trend="Net Cost"
        trendUp={true}
        subtitle="Ticket cost minus refunds"
      />
    </div>
  );
}

export default StatCardsGrid;
