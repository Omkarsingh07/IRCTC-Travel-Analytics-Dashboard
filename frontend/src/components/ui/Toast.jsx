import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function Toast() {
  const { toast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
          isSuccess
            ? "bg-white/95 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            : isError
            ? "bg-white/95 dark:bg-slate-900/90 text-rose-600 dark:text-rose-400 border-rose-500/30"
            : "bg-white/95 dark:bg-slate-900/90 text-blue-600 dark:text-blue-400 border-blue-500/30"
        }`}
      >
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />}
        {isError && <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />}

        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.message}</span>
      </motion.div>
    </AnimatePresence>
  );
}

export default Toast;
