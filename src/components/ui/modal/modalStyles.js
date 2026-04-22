export const modalClasses = {
  overlay:
    "fixed inset-0 z-[1300] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-3 py-4 backdrop-blur-[3px] sm:px-8 lg:px-10",
  panel:
    "w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]",
  header:
    "flex items-center justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50/60 px-6 py-5 sm:px-8",
  headerIcon:
    "flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-[#007EA7] shadow-sm",
  symbolIcon:
    "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700",
  headerTitle: "text-xl font-semibold text-slate-900",
  headerSubtitle: "mt-1 text-sm text-slate-500",
  closeButton:
    "rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700",
  body: "flex-1 overflow-y-auto px-6 py-5 sm:px-8",
  footer:
    "flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4 sm:px-8",
  stepperSection: "border-b border-slate-100 px-6 pb-4 pt-6 sm:px-8",
  errorAlert:
    "flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left",
  alertIcon: "mt-0.5 h-5 w-5 shrink-0",
};

export const muiModalSx = {
  "& .MuiBackdrop-root": {
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    backdropFilter: "blur(3px)",
  },
  "& .MuiDialog-paper, & .MuiPaper-root": {
    borderRadius: "28px",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.18)",
    backgroundImage:
      "linear-gradient(180deg, rgba(248, 250, 252, 0.7) 0%, rgba(255, 255, 255, 1) 96px)",
  },
};
