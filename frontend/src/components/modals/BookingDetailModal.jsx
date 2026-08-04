import { useApp } from "../../context/AppContext";
import Badge from "../ui/Badge";
import { formatCurrency, formatPNR, formatDate } from "../../utils/formatters";
import { X, Train, Calendar, Clock, MapPin, CreditCard, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BookingDetailModal() {
  const { selectedBooking, setSelectedBooking } = useApp();

  if (!selectedBooking) return null;

  const b = selectedBooking;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="glass-panel w-full max-w-xl rounded-3xl p-6 lg:p-8 shadow-2xl border border-slate-200 dark:border-slate-700/80 relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedBooking(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  PNR {formatPNR(b.pnr)}
                </span>
                <Badge status={b.status} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {b.train_name && b.train_name !== "Not available"
                  ? b.train_name
                  : `Train #${b.train_number}`}
              </h2>
            </div>
          </div>

          {/* Station Route Timeline */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">From Station</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  {b.from_station}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">To Station</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5 justify-end">
                  <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  {b.to_station}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                Journey: {formatDate(b.journey_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                Booked: {formatDate(b.booking_date)}
              </span>
            </div>
          </div>

          {/* Ticket Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Travel Class</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{b.travel_class || "N/A"}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Quota</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">{b.quota || "GENERAL"}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Train Number</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">#{b.train_number}</p>
            </div>
          </div>

          {/* Fare Breakdown */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
              <span>Base Ticket Fare</span>
              <span className="font-medium">{formatCurrency(b.ticket_fare, 2)}</span>
            </div>
            {b.convenience_fee > 0 && (
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Convenience Fee</span>
                <span className="font-medium">{formatCurrency(b.convenience_fee, 2)}</span>
              </div>
            )}
            {b.wallet_charge > 0 && (
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>PG / Wallet Charge</span>
                <span className="font-medium">{formatCurrency(b.wallet_charge, 2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-indigo-500/30 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-slate-100">
              <span>Total Fare Charged</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(b.total_fare, 2)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default BookingDetailModal;
