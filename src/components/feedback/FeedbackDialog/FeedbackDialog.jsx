import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import PropTypes from "prop-types";
import { modalClasses } from "../../ui/modal/modalStyles";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

const TONE_CLASSES = {
  success: {
    icon: CheckCircle2,
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  warning: {
    icon: TriangleAlert,
    iconWrap: "border-amber-200 bg-amber-50 text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
  danger: {
    icon: AlertCircle,
    iconWrap: "border-red-200 bg-red-50 text-red-600",
    badge: "bg-red-100 text-red-700",
  },
  info: {
    icon: Info,
    iconWrap: "border-sky-200 bg-sky-50 text-sky-600",
    badge: "bg-sky-100 text-sky-700",
  },
};

export default function FeedbackDialog({
  isOpen,
  onClose,
  title,
  description,
  tone = "info",
  icon: CustomIcon,
  badge,
  size = "sm",
  children,
  footer,
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  contentClassName = "",
  bodyClassName = "",
  footerClassName = "",
  zIndexClassName = "z-[9999]",
  onMouseEnter,
  onMouseLeave,
}) {
  const toneConfig = TONE_CLASSES[tone] ?? TONE_CLASSES.info;
  const Icon = CustomIcon ?? toneConfig.icon;

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`${modalClasses.overlay} ${zIndexClassName}`}
          onClick={closeOnOverlay ? onClose : undefined}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={`${modalClasses.panel} ${SIZE_CLASSES[size] || SIZE_CLASSES.sm} ${contentClassName}`}
            onClick={(event) => event.stopPropagation()}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative flex flex-col gap-5 px-6 pb-6 pt-6 text-center sm:px-8 sm:pb-8 sm:pt-7">
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`absolute right-4 top-4 ${modalClasses.closeButton}`}
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <div className="flex flex-col items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-[20px] border shadow-sm ${toneConfig.iconWrap}`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-2">
                    {badge && (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneConfig.badge}`}
                      >
                        {badge}
                      </span>
                    )}
                    <h2 className="text-xl font-semibold leading-tight text-slate-900">
                      {title}
                    </h2>
                  </div>

                  {description && (
                    <p className="mx-auto max-w-[36rem] text-sm leading-relaxed text-slate-500">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {children && (
                <div className={`text-left ${bodyClassName}`}>
                  {children}
                </div>
              )}
            </div>

            {footer && (
              <div className={`${modalClasses.footer} ${footerClassName}`}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

FeedbackDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  tone: PropTypes.oneOf(["success", "warning", "danger", "info"]),
  icon: PropTypes.elementType,
  badge: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  children: PropTypes.node,
  footer: PropTypes.node,
  closeOnOverlay: PropTypes.bool,
  closeOnEscape: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  contentClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  zIndexClassName: PropTypes.string,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
};
