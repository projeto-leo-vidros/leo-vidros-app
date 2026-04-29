import { useEffect } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    shell: "border-emerald-200 bg-white text-slate-800",
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-600",
    progress: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    shell: "border-red-200 bg-white text-slate-800",
    iconWrap: "border-red-200 bg-red-50 text-red-600",
    progress: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    shell: "border-amber-200 bg-white text-slate-800",
    iconWrap: "border-amber-200 bg-amber-50 text-amber-600",
    progress: "bg-amber-500",
  },
  info: {
    icon: Info,
    shell: "border-sky-200 bg-white text-slate-800",
    iconWrap: "border-sky-200 bg-sky-50 text-sky-600",
    progress: "bg-sky-500",
  },
};

const Toast = ({ type = "success", message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration <= 0) return undefined;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.success;
  const Icon = config.icon;

  return (
    <div className="fixed right-4 top-4 z-[99999] animate-slideInRight">
      <div
        className={`relative min-w-[320px] max-w-[420px] overflow-hidden rounded-[22px] border shadow-[0_18px_50px_rgba(15,23,42,0.16)] ${config.shell}`}
      >
        <div className="flex items-start gap-3 px-4 py-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${config.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {duration > 0 && (
          <div className="h-1 w-full bg-slate-100">
            <div className={`h-full ${config.progress}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Toast;
