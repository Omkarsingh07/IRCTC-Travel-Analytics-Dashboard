function SummaryCard({ title, value, icon, color }) {
  return (
    <div
      className="
        bg-white
        rounded-3xl
        p-6
        border border-gray-100
        shadow-sm
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
      "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">
            {title}
          </p>

          <h2 className="text-3xl font-bold text-gray-900 mt-3">
            {value}
          </h2>
        </div>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default SummaryCard;