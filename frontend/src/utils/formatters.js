export const formatCurrency = (amount, decimals = 0) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(amount);
};

export const formatPNR = (pnr) => {
  if (!pnr) return "N/A";
  const str = String(pnr).replace(/\D/g, "");
  if (str.length === 10) {
    return `${str.slice(0, 3)}-${str.slice(3, 6)}-${str.slice(6)}`;
  }
  return pnr;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const cleanStr = dateStr.replace(/ HRS/i, "").trim();
  const dateObj = new Date(cleanStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return cleanStr.split(" ")[0] || dateStr;
};

const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

export const extractYear = (dateStr) => {
  if (!dateStr) return null;
  const match = String(dateStr).match(/\b(20\d\d|19\d\d)\b/);
  return match ? match[1] : null;
};

export const getJourneyTimestamp = (dateStr) => {
  if (!dateStr) return 0;
  const clean = String(dateStr).replace(/ HRS/i, "").trim();

  // Try matching DD-Mon-YYYY (e.g. 06-Aug-2026)
  const parts = clean.split(/[- /]/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && MONTH_MAP[monthStr] !== undefined && !isNaN(year)) {
      return new Date(Date.UTC(year, MONTH_MAP[monthStr], day)).getTime();
    }
  }

  const parsed = Date.parse(clean);
  return isNaN(parsed) ? 0 : parsed;
};

export const getStatusBadgeStyle = (status) => {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE" || s === "CONFIRMED" || s === "BOOKED") {
    return {
      label: "Confirmed",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    };
  }
  if (s === "CANCELLED" || s === "REFUNDED") {
    return {
      label: "Cancelled",
      bg: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20",
      dot: "bg-rose-500",
    };
  }
  if (s === "COMPLETED") {
    return {
      label: "Completed",
      bg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20",
      dot: "bg-blue-500",
    };
  }
  return {
    label: status || "Unknown",
    bg: "bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  };
};

export const formatBookingType = (quota) => {
  if (!quota) return "General";
  const q = String(quota).trim();
  if (!q) return "General";
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getBookingTypeBadgeStyle = (quota) => {
  const label = formatBookingType(quota);
  const q = (quota || "").toUpperCase().trim();

  if (q === "GENERAL" || q === "") {
    return {
      label,
      bg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20",
      dot: "bg-blue-500",
    };
  }

  if (q === "TATKAL" || q.includes("TATKAL")) {
    return {
      label,
      bg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
    };
  }

  return {
    label,
    bg: "bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-500",
  };
};

