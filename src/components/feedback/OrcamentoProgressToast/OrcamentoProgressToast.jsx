import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import OrcamentosService from "../../../api/services/orcamentosService";

const STATUS_CONFIG = {
  GERANDO_ORCAMENTO: {
    label: "Gerando orcamento...",
    icon: Loader2,
    iconWrap: "border-sky-200 bg-sky-50 text-sky-600",
    progress: "bg-sky-500",
    progressValue: 35,
    animate: true,
  },
  GERANDO_PDF: {
    label: "Gerando PDF...",
    icon: Loader2,
    iconWrap: "border-amber-200 bg-amber-50 text-amber-600",
    progress: "bg-amber-500",
    progressValue: 72,
    animate: true,
  },
  FINALIZADO: {
    label: "Orcamento gerado com sucesso!",
    icon: CheckCircle,
    iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-600",
    progress: "bg-emerald-500",
    progressValue: 100,
    animate: false,
  },
  ERRO: {
    label: "Erro ao gerar orcamento",
    icon: AlertCircle,
    iconWrap: "border-red-200 bg-red-50 text-red-600",
    progress: "bg-red-500",
    progressValue: 100,
    animate: false,
  },
};

export default function OrcamentoProgressToast({
  orcamentoId,
  numeroOrcamento,
  initialStatus = "GERANDO_ORCAMENTO",
  onClose,
  onFinished,
}) {
  const [status, setStatus] = useState(initialStatus);
  const sseRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  const handleDownload = useCallback(async () => {
    if (!orcamentoId) {
      return;
    }

    try {
      let result = null;
      let tentativas = 0;
      const maxTentativas = 15;

      while (tentativas < maxTentativas) {
        result = await OrcamentosService.baixarPdf(orcamentoId, numeroOrcamento);

        if (result.success && result.data) {
          const url = window.URL.createObjectURL(result.data);
          const link = document.createElement("a");
          link.href = url;
          link.download = `orcamento_${numeroOrcamento || orcamentoId}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          return;
        }

        tentativas++;
        if (tentativas < maxTentativas) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch {
      // O erro de download fica representado pelo fluxo visual do toast.
    }
  }, [orcamentoId, numeroOrcamento]);

  useEffect(() => {
    if (!orcamentoId) return undefined;

    const sse = OrcamentosService.monitorarProgresso(orcamentoId, (eventData) => {
      const newStatus = eventData.status;
      setStatus(newStatus);

      if (newStatus === "FINALIZADO") {
        onFinished?.();
        setTimeout(() => {
          handleDownload();
        }, 500);
      }
    });

    sseRef.current = sse;

    const autoCloseTimer = autoCloseTimerRef.current;
    return () => {
      sse.close();
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [handleDownload, onFinished, orcamentoId]);

  const handleClose = useCallback(() => {
    sseRef.current?.close();
    const autoCloseTimer = autoCloseTimerRef.current;
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    onClose?.();
  }, [onClose]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.GERANDO_ORCAMENTO;
  const IconComponent = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] animate-slideInRight">
      <div className="min-w-[340px] max-w-[420px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start gap-3 px-4 py-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${config.iconWrap}`}>
            <IconComponent
              className={`h-5 w-5 ${config.animate ? "animate-spin" : ""}`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{config.label}</p>
            {numeroOrcamento && (
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <FileText className="h-3.5 w-3.5" />
                {numeroOrcamento}
              </p>
            )}
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            <span>Progresso</span>
            <span>{config.progressValue}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${config.progress}`}
              style={{ width: `${config.progressValue}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
