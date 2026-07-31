import RecentTripsTable from "../dashboard/RecentTripsTable";
import { useApp } from "../../context/AppContext";
import { exportBookingsToCSV } from "../../utils/exportCsv";
import { Ticket, Download } from "lucide-react";

export function BookingsView() {
  const { bookingsData } = useApp();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-indigo-500" />
            Bookings Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete records of all IRCTC train tickets parsed from Gmail into SQLite database.
          </p>
        </div>

        <button
          onClick={() => exportBookingsToCSV(bookingsData?.bookings)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export All Bookings CSV</span>
        </button>
      </div>

      <RecentTripsTable limit={15} />
    </div>
  );
}

export default BookingsView;
