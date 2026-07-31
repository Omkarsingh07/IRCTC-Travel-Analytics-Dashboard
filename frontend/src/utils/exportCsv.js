export const exportBookingsToCSV = (bookings, filename = "irctc_travel_bookings.csv") => {
  if (!bookings || !bookings.length) {
    alert("No booking data available to export.");
    return;
  }

  const headers = [
    "PNR",
    "Train Number",
    "Train Name",
    "Class",
    "From Station",
    "To Station",
    "Journey Date",
    "Booking Date",
    "Status",
    "Ticket Fare",
    "Convenience Fee",
    "Total Fare"
  ];

  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const b of bookings) {
    const row = [
      `"${b.pnr || ''}"`,
      `"${b.train_number || ''}"`,
      `"${(b.train_name || '').replace(/"/g, '""')}"`,
      `"${b.travel_class || ''}"`,
      `"${(b.from_station || '').replace(/"/g, '""')}"`,
      `"${(b.to_station || '').replace(/"/g, '""')}"`,
      `"${b.journey_date || ''}"`,
      `"${b.booking_date || ''}"`,
      `"${b.status || ''}"`,
      b.ticket_fare || 0,
      b.convenience_fee || 0,
      b.total_fare || 0
    ];
    csvRows.push(row.join(","));
  }

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
