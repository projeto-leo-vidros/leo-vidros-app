import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    progressColor: "bg-emerald-500",
    ring: "ring-emerald-100",
  },
  error: {
    icon: XCircle,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    progressColor: "bg-red-500",
    ring: "ring-red-100",
  },
};

/**
 * FeedbackModal — Unified feedback component for success/error states.
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen       - Controls visibility
 * @param {function} props.onClose      - Called when the modal is dismissed
 * @param {'success'|'error'} [props.type='success'] - Visual variant
 * @param {string}   [props.title]      - Heading text
 * @param {string}   [props.description] - Body text
 * @param {number}   [props.duration=3000] - Auto-close delay in ms (0 to disable)
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  type = "success",
  title,
  description,
  duration = 3000,
}) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.success;
  const Icon = config.icon;

  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const elapsedRef = useRef(0);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // ── Auto-close timer via rAF ────────────────────────────────
  const tick = useCallback(() => {
    if (!startRef.current) startRef.current = performance.now();
    const elapsed = elapsedRef.current + (performance.now() - startRef.current);
    const pct = Math.min(elapsed / duration, 1);
    setProgress(pct);

    if (pct >= 1) {
      onClose();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, onClose]);

  useEffect(() => {
    if (!isOpen || duration <= 0) return;

    if (!paused) {
      startRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (startRef.current) {
        elapsedRef.current += performance.now() - startRef.current;
      }
      startRef.current = null;
    };
  }, [isOpen, paused, duration, tick]);

  // Reset progress on open
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      elapsedRef.current = 0;
      startRef.current = null;
      setPaused(false);
    }
  }, [isOpen]);

  // ── Keyboard: Escape to close ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Focus trap ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    // Slight delay to let the modal render first
    const timer = setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  // ── Hover pause ─────────────────────────────────────────────
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[380px] bg-white rounded-2xl shadow-2xl outline-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            aria-describedby={description ? "feedback-modal-desc" : undefined}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center px-8 pt-8 pb-6 gap-3">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-full ${config.iconBg} ring-8 ${config.ring} flex items-center justify-center mb-1`}
              >
                <Icon size={28} className={config.iconColor} strokeWidth={2} />
              </div>

              {/* Title */}
              {title && (
                <h2
                  id="feedback-modal-title"
                  className="text-lg font-semibold text-slate-800 leading-tight"
                >
                  {title}
                </h2>
              )}

              {/* Description */}
              {description && (
                <p
                  id="feedback-modal-desc"
                  className="text-sm text-slate-500 leading-relaxed max-w-[280px]"
                >
                  {description}
                </p>
              )}
            </div>

            {/* Animated progress bar */}
            {duration > 0 && (
              <div className="h-1 w-full bg-slate-100">
                <motion.div
                  className={`h-full ${config.progressColor} origin-left`}
                  style={{ width: `${(1 - progress) * 100}%` }}
                  transition={{ duration: 0, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
