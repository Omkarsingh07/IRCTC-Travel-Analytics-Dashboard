import { getStatusBadgeStyle } from "../../utils/formatters";

export function Badge({ status }) {
  const style = getStatusBadgeStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} transition-all duration-200`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      {style.label}
    </span>
  );
}

export default Badge;
