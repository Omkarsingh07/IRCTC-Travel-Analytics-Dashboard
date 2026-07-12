import SummaryCard from "./SummaryCard";

import {
  Train,
  Ban,
  CheckCircle,
  Wallet,
  IndianRupee,
  Landmark,
} from "lucide-react";

function Dashboard({ summary }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-8 pt-12">

        <h1 className="text-5xl font-bold text-gray-900">
          🚆 IRCTC Travel Dashboard
        </h1>

        <p className="text-gray-500 mt-3 text-lg">
          View your railway travel insights in one place.
        </p>

      </div>

      {/* Cards */}

      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

          <SummaryCard
            title="Total Bookings"
            value={summary.total_bookings}
            icon={<Train size={28} />}
            color="bg-blue-500"
          />

          <SummaryCard
            title="Cancelled Tickets"
            value={summary.cancelled_tickets}
            icon={<Ban size={28} />}
            color="bg-red-500"
          />

          <SummaryCard
            title="Completed Trips"
            value={summary.completed_trips}
            icon={<CheckCircle size={28} />}
            color="bg-green-500"
          />

          <SummaryCard
            title="Total Ticket Cost"
            value={`₹${Math.round(
              summary.total_ticket_cost
            ).toLocaleString("en-IN")}`}
            icon={<IndianRupee size={28} />}
            color="bg-purple-500"
          />

          <SummaryCard
            title="Total Refund"
            value={`₹${Math.round(
              summary.total_refund
            ).toLocaleString("en-IN")}`}
            icon={<Wallet size={28} />}
            color="bg-orange-500"
          />

          <SummaryCard
            title="Net Amount Spent"
            value={`₹${Math.round(
              summary.net_amount_spent
            ).toLocaleString("en-IN")}`}
            icon={<Landmark size={28} />}
            color="bg-emerald-600"
          />

        </div>

      </div>

    </div>
  );
}

export default Dashboard;