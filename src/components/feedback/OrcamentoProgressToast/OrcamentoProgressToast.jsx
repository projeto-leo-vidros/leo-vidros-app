import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import OrcamentosService from "../../../api/services/orcamentosService";

/**
 * Estados do progresso:
 * - GERANDO_ORCAMENTO: Salvando dados no banco
 * - GERANDO_PDF: PDF em processamento pelo microserviço
 * - FINALIZADO: PDF pronto para download
 * - ERRO: Ocorreu um erro em alguma etapa
 */

const STATUS_CONFIG = {
  GERANDO_ORCAMENTO: {
    label: "Gerando orçamento...",
    icon: Loader2,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    progress: 33,
    animate: true,
  },
  GERANDO_PDF: {
    label: "Gerando PDF...",
    icon: Loader2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    progress: 66,
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

/**
 * Toast de progresso da geração de orçamento.
 * Posicionado no canto inferior direito.
 * Conecta-se via SSE para acompanhar o progresso em tempo real.
 *
 * @param {object} props
 * @param {string|number} props.orcamentoId - ID do orçamento para monitorar
 * @param {string} [props.numeroOrcamento] - Número do orçamento para exibição
 * @param {string} [props.initialStatus] - Status inicial (GERANDO_ORCAMENTO por padrão)
 * @param {function} props.onClose - Callback para fechar o toast
 * @param {function} [props.onFinished] - Callback quando o PDF está pronto
 */
export default function OrcamentoProgressToast({
  orcamentoId,
  numeroOrcamento,
  initialStatus = "GERANDO_ORCAMENTO",
  onClose,
  onFinished,
}) {
  const [status, setStatus] = useState(initialStatus);
  const [isDownloading, setIsDownloading] = useState(false);
  const sseRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  // Conectar ao SSE quando o componente montar
  useEffect(() => {
    if (!orcamentoId) return;

    const sse = OrcamentosService.monitorarProgresso(
      orcamentoId,
      (eventData) => {
        const newStatus = eventData.status;
        setStatus(newStatus);

        if (newStatus === "FINALIZADO") {
          onFinished?.();
          // Auto-close após 10s quando finalizado
          autoCloseTimerRef.current = setTimeout(() => {
            onClose?.();
          }, 10000);
        }

        if (newStatus === "ERRO") {
          // Auto-close após 8s quando erro
          autoCloseTimerRef.current = setTimeout(() => {
            onClose?.();
          }, 8000);
        }
      },
    );

    sseRef.current = sse;

    return () => {
      sse.close();
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [orcamentoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = useCallback(async () => {
    if (!orcamentoId) return;
    setIsDownloading(true);

    try {
      const result = await OrcamentosService.baixarPdf(orcamentoId);
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `orcamento_${numeroOrcamento || orcamentoId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Erro ao baixar PDF:", e);
    } finally {
      setIsDownloading(false);
    }
  }, [orcamentoId, numeroOrcamento]);

  const handleClose = useCallback(() => {
    sseRef.current?.close();
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    onClose?.();
  }, [onClose]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.GERANDO_ORCAMENTO;
  const IconComponent = config.icon;

  return (
    <div className="fixed bottom-6 right-6 z-[99999] animate-slideInRight">
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

        {/* Steps */}
        <div className="flex items-center justify-between gap-1 px-1">
          <StepIndicator
            label="Orçamento"
            done={
              status === "GERANDO_PDF" ||
              status === "FINALIZADO" ||
              status === "ERRO"
            }
            active={status === "GERANDO_ORCAMENTO"}
            error={false}
          />
          <div className="h-px flex-1 bg-slate-300" />
          <StepIndicator
            label="PDF"
            done={status === "FINALIZADO"}
            active={status === "GERANDO_PDF"}
            error={status === "ERRO"}
          />
          <div className="h-px flex-1 bg-slate-300" />
          <StepIndicator
            label="Concluído"
            done={status === "FINALIZADO"}
            active={false}
            error={status === "ERRO"}
          />
        </div>

        {/* Download button */}
        {status === "FINALIZADO" && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isDownloading ? "Baixando..." : "Baixar PDF"}
          </button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ label, done, active, error }) {
  let dotClass = "bg-slate-300";
  let textClass = "text-slate-400";

  if (error) {
    dotClass = "bg-red-500";
    textClass = "text-red-600";
  } else if (done) {
    dotClass = "bg-green-500";
    textClass = "text-green-700";
  } else if (active) {
    dotClass = "bg-blue-500 animate-pulse";
    textClass = "text-blue-700 font-semibold";
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span className={`text-[10px] ${textClass}`}>{label}</span>
    </div>
  );
}
