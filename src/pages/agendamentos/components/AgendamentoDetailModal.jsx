import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  ExternalLink,
  Edit3,
  Package,
  FileText,
} from "lucide-react";
import { cn } from "../../../utils/cn";
import {
  normalizeStatus,
  statusConfig,
  tipoConfig,
} from "../../../utils/agendamentoStatus";
import {
  getAgendamentoDisplayName,
  isFinalizedStatus,
} from "../utils/eventHelpers";

export default function AgendamentoDetailModal({
  agendamento,
  isOpen,
  onClose,
  onEdit,
  onLocation,
}) {
  if (!isOpen || !agendamento) return null;

  const statusNome = agendamento.statusAgendamento?.nome || "PENDENTE";
  const stCfg =
    statusConfig[normalizeStatus(statusNome)] || statusConfig.PENDENTE;
  const tipoCfg = tipoConfig[agendamento.tipoAgendamento] || tipoConfig.SERVICO;
  const isFinalizado = isFinalizedStatus(statusNome);
  const { fullTitle } = getAgendamentoDisplayName(agendamento);

  const enderecoCompleto = (() => {
    if (!agendamento.endereco) return null;
    const e = agendamento.endereco;
    return [e.rua, e.bairro, e.cidade, e.estado, e.cep]
      .filter(Boolean)
      .join(", ");
  })();

  const hasEndereco = !!enderecoCompleto;

  const funcionarios =
    agendamento.funcionarios?.length > 0
      ? agendamento.funcionarios.map((f) => f.nome).join(", ")
      : "Sem funcionario atribuido";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded">
                <CalendarIcon className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{fullTitle}</h3>
                <p className="text-xs text-gray-500">
                  #{String(agendamento.id).padStart(3, "0")}
                </p>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  stCfg.color,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", stCfg.dot)} />
                {stCfg.label}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  tipoCfg.color,
                )}
              >
                {tipoCfg.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-gray-700">
                {agendamento.dataAgendamento
                  ? format(
                      parseISO(agendamento.dataAgendamento),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )
                  : "-"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-gray-700">
                {agendamento.inicioAgendamento?.substring(0, 5)} -{" "}
                {agendamento.fimAgendamento?.substring(0, 5)}
              </span>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-gray-700">{funcionarios}</span>
            </div>

            {enderecoCompleto && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div>
                  <span className="text-gray-700">{enderecoCompleto}</span>
                  {hasEndereco && (
                    <button
                      onClick={() => {
                        onLocation?.(agendamento);
                        onClose();
                      }}
                      className="ml-2 inline-flex cursor-pointer items-center gap-1 text-xs text-[#007EA7] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver no mapa
                    </button>
                  )}
                </div>
              </div>
            )}

            {agendamento.observacao && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3.5 text-sm text-gray-600">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Observacao
                  </p>
                </div>
                <p className="whitespace-pre-wrap">{agendamento.observacao}</p>
              </div>
            )}

            {agendamento.tipoAgendamento === "ORCAMENTO" &&
              agendamento.produtos?.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Produtos
                  </p>
                </div>
                <div className="space-y-1.5">
                  {agendamento.produtos.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                      <span>
                        {p.produto?.nome || p.nome || `Produto #${i + 1}`}
                      </span>
                      {p.quantidade && (
                        <span className="text-xs text-gray-400">
                          x{p.quantidade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            {hasEndereco && (
              <button
                onClick={() => {
                  onLocation?.(agendamento);
                  onClose();
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#007EA7]/30 px-4 py-2 text-sm font-medium text-[#007EA7] transition-colors hover:bg-[#007EA7]/5"
              >
                <MapPin className="h-4 w-4" /> Ver localizacao
              </button>
            )}
            {!isFinalizado && (
              <button
                onClick={() => {
                  onEdit?.(agendamento);
                  onClose();
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#007EA7] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#006b8f]"
              >
                <Edit3 className="h-4 w-4" /> Editar
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
