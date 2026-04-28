import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import FeedbackDialog from "../FeedbackDialog/FeedbackDialog";

export default function FeedbackModal({
  isOpen,
  onClose,
  type = "success",
  title,
  description,
  duration = 3000,
}) {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!isOpen || duration <= 0) return undefined;

    const tick = () => {
      if (!startRef.current) startRef.current = performance.now();
      const elapsed = elapsedRef.current + (performance.now() - startRef.current);
      const pct = Math.min(elapsed / duration, 1);

      setProgress(pct);

      if (pct >= 1) {
        onClose();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

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
  }, [duration, isOpen, onClose, paused]);

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      elapsedRef.current = 0;
      startRef.current = null;
      setPaused(false);
    }
  }, [isOpen]);

  return (
    <FeedbackDialog
      isOpen={isOpen}
      onClose={onClose}
      tone={type === "error" ? "danger" : "success"}
      title={title}
      description={description}
      badge={type === "error" ? "Erro" : "Concluido"}
      size="sm"
      bodyClassName="mt-1"
      contentClassName="overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {duration > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-slate-100">
          <motion.div
            className={type === "error" ? "h-full bg-red-500" : "h-full bg-emerald-500"}
            style={{ width: `${(1 - progress) * 100}%` }}
            transition={{ duration: 0, ease: "linear" }}
          />
        </div>
      )}
    </FeedbackDialog>
  );
}
