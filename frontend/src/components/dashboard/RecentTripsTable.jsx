import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import Badge, { BookingTypeBadge } from "../ui/Badge";
import {
  formatCurrency,
  formatPNR,
  formatDate,
  extractYear,
  getJourneyTimestamp,
  formatBookingType,
} from "../../utils/formatters";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Calendar,
  Train,
  ExternalLink,
  SearchX,
  RotateCcw,
  Tag,
} from "lucide-react";

export function RecentTripsTable({ limit }) {
  const { bookingsData, setSelectedBooking } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("ALL");
  const [sortField, setSortField] = useState("journey_date");
  const [sortAsc, setSortAsc] = useState(false); // Default: Descending (Newest First)
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = limit || 10;
  const allBookings = bookingsData?.bookings || [];

  // 1. Dynamic Year List Extraction from Dataset (Descending order: 2026, 2025, 2024...)
  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    allBookings.forEach((item) => {
      const year = extractYear(item.journey_date || item.booking_date);
      if (year) yearsSet.add(year);
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [allBookings]);

  // 2. Dynamic Booking Types Extraction from Dataset
  const availableBookingTypes = useMemo(() => {
    const typesSet = new Set();
    allBookings.forEach((item) => {
      const typeLabel = formatBookingType(item.quota);
      if (typeLabel) typesSet.add(typeLabel);
    });
    const typesArray = Array.from(typesSet);
    return typesArray.sort((a, b) => {
      if (a === "General") return -1;
      if (b === "General") return 1;
      if (a === "Tatkal") return -1;
      if (b === "Tatkal") return 1;
      return a.localeCompare(b);
    });
  }, [allBookings]);

  // 3. Combined Filtering + Default Journey Date Descending Sorting
  const filteredBookings = useMemo(() => {
    return allBookings
      .filter((item) => {
        // Search Keyword filter
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !q ||
          (item.pnr || "").toLowerCase().includes(q) ||
          (item.train_name || "").toLowerCase().includes(q) ||
          (item.train_number || "").toLowerCase().includes(q) ||
          (item.from_station || "").toLowerCase().includes(q) ||
          (item.to_station || "").toLowerCase().includes(q);

        // Status filter
        const s = statusFilter.toUpperCase();
        const matchesStatus =
          s === "ALL"
            ? true
            : s === "ACTIVE"
            ? item.status === "ACTIVE" || item.status === "CONFIRMED" || item.status === "BOOKED"
            : item.status === "CANCELLED" || item.status === "REFUNDED";

        // Year filter
        const itemYear = extractYear(item.journey_date || item.booking_date);
        const matchesYear = yearFilter === "ALL" || itemYear === yearFilter;

        // Booking Type filter
        const itemType = formatBookingType(item.quota);
        const matchesBookingType =
          bookingTypeFilter === "ALL" || itemType === bookingTypeFilter;

        return matchesSearch && matchesStatus && matchesYear && matchesBookingType;
      })
      .sort((a, b) => {
        if (sortField === "journey_date") {
          const timeA = getJourneyTimestamp(a.journey_date);
          const timeB = getJourneyTimestamp(b.journey_date);
          return sortAsc ? timeA - timeB : timeB - timeA;
        }

        if (sortField === "total_fare" || sortField === "ticket_fare") {
          const fareA = Number(a.total_fare || a.ticket_fare || 0);
          const fareB = Number(b.total_fare || b.ticket_fare || 0);
          return sortAsc ? fareA - fareB : fareB - fareA;
        }

        const valA = String(a[sortField] || "");
        const valB = String(b[sortField] || "");
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
  }, [allBookings, searchTerm, statusFilter, yearFilter, bookingTypeFilter, sortField, sortAsc]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Sort Toggle Handler
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default to Descending for new field
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setYearFilter("ALL");
    setBookingTypeFilter("ALL");
    setSortField("journey_date");
    setSortAsc(false);
    setCurrentPage(1);
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header & Combined Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Train className="w-5 h-5 text-indigo-500" />
            Travel Bookings
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Showing {filteredBookings.length} matching train journeys
          </p>
        </div>

        {/* Search, Year, Status & Booking Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search PNR, train, city..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Dynamic Year Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Status</option>
              <option value="ACTIVE" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Confirmed</option>
              <option value="CANCELLED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cancelled</option>
            </select>
          </div>

          {/* Dynamic Booking Type Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Booking Type:</span>
            <select
              value={bookingTypeFilter}
              onChange={(e) => {
                setBookingTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Types</option>
              {availableBookingTypes.map((type) => (
                <option key={type} value={type} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || statusFilter !== "ALL" || yearFilter !== "ALL" || bookingTypeFilter !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">PNR</th>
              <th className="py-3 px-4">Train</th>
              <th className="py-3 px-4">From</th>
              <th className="py-3 px-4">To</th>

              {/* Sortable Journey Date Header (Default Descending) */}
              <th
                onClick={() => toggleSort("journey_date")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition-colors"
              >
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Journey Date</span>
                  {sortField === "journey_date" ? (
                    sortAsc ? (
                      <ArrowUp className="w-3.5 h-3.5 text-indigo-400" title="Oldest First" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-indigo-400" title="Newest First (Default)" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  )}
                  <span className="text-[10px] normal-case font-normal text-slate-400 hidden xl:inline">
                    ({sortAsc ? "Oldest First" : "Newest First"})
                  </span>
                </div>
              </th>

              <th className="py-3 px-4">Booking Type</th>
              <th className="py-3 px-4">Status</th>

              <th
                onClick={() => toggleSort("total_fare")}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white text-right select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Fare</span>
                  {sortField === "total_fare" ? (
                    sortAsc ? <ArrowUp className="w-3.5 h-3.5 text-indigo-400" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedBooking(item)}
                  className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span>{formatPNR(item.pnr)}</span>
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>

                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-xs truncate">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {item.train_name && item.train_name !== "Not available"
                        ? item.train_name
                        : `Train #${item.train_number}`}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Class: {item.travel_class || "N/A"} • #{item.train_number}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                    {item.from_station}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                    {item.to_station}
                  </td>

                  <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                    {formatDate(item.journey_date)}
                  </td>

                  <td className="py-3.5 px-4">
                    <BookingTypeBadge quota={item.quota} />
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge status={item.status} />
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.total_fare, 2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <SearchX className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        No bookings found
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        Try changing your search keywords, status filter, booking type filter, or selected journey year.
                      </p>
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredBookings.length > 0 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentTripsTable;

