import { useState } from "react";
import { Calendar, Clock, X, RefreshCw, XCircle, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../Button/Button.component";

const AgendamentoNotification = ({
  agendamento,
  onReagendar,
  onCancelar,
  onIniciar,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

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

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-2xl border-l-4 border-orange-500 w-96 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">
                  Agendamento Próximo
                </h3>
                <p className="text-orange-100 text-xs">{getTimeUntilStart()}</p>
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
            <div className="space-y-3">
              {/* Informações do agendamento */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
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
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {agendamento.servico.nome}
                  </p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {agendamento.inicioAgendamento?.substring(0, 5)} -{" "}
                    {agendamento.fimAgendamento?.substring(0, 5)}
                  </span>
                </div>

                {agendamento.endereco && (
                  <p className="text-xs text-gray-500 mt-2">
                    📍 {agendamento.endereco.rua}, {agendamento.endereco.numero}{" "}
                    - {agendamento.endereco.bairro}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="space-y-2">
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
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center border-t">
            Esta notificação fecha automaticamente em 60 segundos
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AgendamentoNotification;
