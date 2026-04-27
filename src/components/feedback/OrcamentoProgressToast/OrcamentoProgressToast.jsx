import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import OrcamentosService from "../../../api/services/orcamentosService";

const STATUS_CONFIG = {
  GERANDO_ORCAMENTO: {
    label: "Gerando orçamento...",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    progress: 0,
    animate: true,
  },
  GERANDO_PDF: {
    label: "Gerando PDF...",
    icon: Loader2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    progress: 0,
    animate: true,
  },
  FINALIZADO: {
    label: "Orçamento gerado com sucesso!",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    progress: 100,
    animate: false,
  },
  ERRO: {
    label: "Erro ao gerar orçamento",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    progress: 100,
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
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch {
      // Erro ao baixar PDF - usuário verá mensagem de erro no toast
    }
  }, [orcamentoId, numeroOrcamento]);

  useEffect(() => {
    if (!orcamentoId) return;

    const sse = OrcamentosService.monitorarProgresso(
      orcamentoId,
      (eventData) => {
        const newStatus = eventData.status;
        setStatus(newStatus);

        if (newStatus === "FINALIZADO") {
          onFinished?.();
          
          setTimeout(() => {
            handleDownload();
          }, 500);
        }
      },
    );

    sseRef.current = sse;

    const autoCloseTimer = autoCloseTimerRef.current;
    return () => {
      sse.close();
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [orcamentoId, handleDownload, onFinished]);

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
    <div className="fixed bottom-6 right-6 z-99999 animate-slideInRight">
      <div
        className={`
        flex flex-col gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-sm
        ${config.bg} ${config.border}
        min-w-[340px] max-w-[420px]
      `}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
            >
              <IconComponent
                className={`h-5 w-5 ${config.color} ${config.animate ? "animate-spin" : ""}`}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">
                {config.label}
              </span>
              {numeroOrcamento && (
                <span className="text-xs text-slate-500">
                  <FileText className="mr-1 inline-block h-3 w-3" />
                  {numeroOrcamento}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              status === "ERRO"
                ? "bg-red-500"
                : status === "FINALIZADO"
                  ? "bg-green-500"
                  : "bg-blue-500"
            }`}
            style={{ width: `${config.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
