import { useState } from "react";
import {
  Calendar,
  Clock,
  X,
  RefreshCw,
  XCircle,
  Play,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button/Button.component";

const AgendamentoNotification = ({
  agendamento,
  tipo = "iniciar",
  presentation = "floating",
  onReagendar,
  onCancelar,
  onIniciar,
  onFinalizar,
  onClose,
  onExpand,
}) => {
  const [loading, setLoading] = useState(false);
  const isCompact = presentation === "compact";
  const isOverlay = presentation === "overlay";

  if (!agendamento) return null;

  const handleReagendar = async () => {
    setLoading(true);
    try {
      await onReagendar(agendamento);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    setLoading(true);
    try {
      await onCancelar(agendamento);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciar = async () => {
    setLoading(true);
    try {
      await onIniciar(agendamento);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async () => {
    setLoading(true);
    try {
      await onFinalizar?.(agendamento);
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilStart = () => {
    const now = new Date();
    const [hours, minutes] = agendamento.inicioAgendamento
      .substring(0, 5)
      .split(":")
      .map(Number);
    const agendamentoTime = new Date();
    agendamentoTime.setHours(hours, minutes, 0, 0);

    const diffMs = agendamentoTime - now;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 0) {
      return "Agendamento em andamento";
    } else if (diffMinutes === 0) {
      return "Começa agora!";
    } else {
      return `Começa em ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
    }
  };

  const getTimeUntilEnd = () => {
    if (!agendamento.fimAgendamento) return "Horário final atingido";
    const now = new Date();
    const [hours, minutes] = agendamento.fimAgendamento
      .substring(0, 5)
      .split(":")
      .map(Number);
    const agendamentoTime = new Date();
    agendamentoTime.setHours(hours, minutes, 0, 0);

    const diffMs = now - agendamentoTime;
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes <= 0) {
      return "Horário final atingido";
    }
    return `Finalizado há ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
  };

  const isFinalizeMode = tipo === "finalizar";
  const title = isFinalizeMode ? "Finalizar Serviço" : "Agendamento Próximo";
  const subtitle = isFinalizeMode ? getTimeUntilEnd() : getTimeUntilStart();

  const cardClass = isCompact
    ? "w-full cursor-pointer overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50 shadow-2xl"
    : "w-full overflow-hidden rounded-xl border border-orange-200 bg-white shadow-2xl";

  if (isCompact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cardClass}
          onClick={() => onExpand?.()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onExpand?.();
            }
          }}
        >
          <div className="flex items-center justify-between border-b border-orange-100 bg-orange-500 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">
                  Iniciar agendamento
                </h3>
                <p className="truncate text-xs text-orange-100">
                  Mensagem persistente até você responder
                </p>
              </div>
            </div>

            <button
              onClick={(event) => {
                event.stopPropagation();
                onClose?.();
              }}
              className="rounded-lg p-1 text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              disabled={loading}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                <Clock className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    #{String(agendamento.id).padStart(3, "0")}
                  </span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                    {isFinalizeMode ? "Finalização" : "Aguardando ação"}
                  </span>
                </div>

                {agendamento.servico && (
                  <p className="truncate text-sm font-medium text-slate-700">
                    {agendamento.servico.nome}
                  </p>
                )}

                <p className="text-sm font-semibold text-orange-600">{subtitle}</p>

                <p className="text-xs text-slate-400">
                  Clique para abrir o popup e responder agora.
                </p>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const containerClass = isOverlay
    ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    : "relative w-full";

  return (
    <AnimatePresence>
      <div className={containerClass}>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cardClass}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-xs text-orange-100">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex flex-col gap-4">
              {/* Informações do agendamento */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    #{String(agendamento.id).padStart(3, "0")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      agendamento.tipoAgendamento === "ORCAMENTO"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {agendamento.tipoAgendamento === "ORCAMENTO"
                      ? "Orçamento"
                      : "Serviço"}
                  </span>
                </div>

                {agendamento.servico && (
                  <p className="text-sm font-medium text-gray-700">
                    {agendamento.servico.nome}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    {agendamento.inicioAgendamento?.substring(0, 5)} -{" "}
                    {agendamento.fimAgendamento?.substring(0, 5)}
                  </span>
                </div>

                {agendamento.endereco && (
                  <div className="flex items-start gap-1.5 text-xs text-gray-500">
                    <span className="shrink-0">📍</span>
                    <span>
                      {agendamento.endereco.rua}
                      {agendamento.endereco.numero ? `, ${agendamento.endereco.numero}` : ""}
                      {agendamento.endereco.bairro ? ` - ${agendamento.endereco.bairro}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2">
                {isFinalizeMode ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                      Fechar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleFinalizar}
                      disabled={loading}
                      fullWidth
                      startIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {loading ? "Processando..." : "Finalizar Serviço"}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={handleIniciar}
                      disabled={loading}
                      fullWidth
                      startIcon={<Play className="w-4 h-4" />}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Processando..." : "Marcar como Em Andamento"}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleReagendar}
                        disabled={loading}
                        startIcon={<RefreshCw className="w-4 h-4" />}
                      >
                        Reagendar
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleCancelar}
                        disabled={loading}
                        startIcon={<XCircle className="w-4 h-4" />}
                      >
                        Cancelar Agendamento
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AgendamentoNotification;
