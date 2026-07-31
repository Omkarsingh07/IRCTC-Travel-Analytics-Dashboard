import { createContext, useContext, useEffect, useState, useCallback } from "react";

const AppContext = createContext();

const API_BASE = "http://127.0.0.1:8000";

export function AppProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [bookingsData, setBookingsData] = useState({ total: 0, bookings: [] });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/summary`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      const data = await res.json();
      setSummary(data);
      return data;
    } catch (err) {
      console.error("Summary fetch error:", err);
      showToast("Error loading summary metrics", "error");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics?top_n=10`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const fetchBookings = async (page = 1, perPage = 100, status = "") => {
    try {
      const statusParam = status ? `&status=${status}` : "";
      const res = await fetch(`${API_BASE}/bookings?page=${page}&per_page=${perPage}${statusParam}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookingsData(data);
      return data;
    } catch (err) {
      console.error("Bookings fetch error:", err);
    }
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchAnalytics(), fetchBookings()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const triggerSync = async () => {
    setIsSyncing(true);
    showToast("Synchronizing with Gmail API...", "info");
    try {
      const res = await fetch(`${API_BASE}/sync`);
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      showToast("Gmail synchronization completed successfully", "success");
      await loadAllData();
      return data;
    } catch (err) {
      console.error("Sync error:", err);
      showToast("Gmail synchronization failed", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshDashboard = async () => {
    showToast("Refreshing analytics metrics...", "info");
    await loadAllData();
    showToast("Dashboard metrics updated successfully", "success");
  };

  return (
    <AppContext.Provider
      value={{
        summary,
        analytics,
        bookingsData,
        loading,
        isSyncing,
        activeTab,
        setActiveTab,
        toast,
        showToast,
        triggerSync,
        refreshDashboard,
        fetchBookings,
        isDbModalOpen,
        setIsDbModalOpen,
        selectedBooking,
        setSelectedBooking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
