import { X, FileText, ExternalLink, User, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrcamentos } from "../../hooks/queries/useOrcamentos";

const STATUS_ABERTOS = ["ENVIADO", "EM ANALISE", "RASCUNHO"];

const STATUS_CONFIG = {
  RASCUNHO: { label: "Rascunho", className: "bg-gray-100 text-gray-600" },
  ENVIADO: { label: "Enviado", className: "bg-blue-100 text-blue-700" },
  "EM ANALISE": { label: "Em análise", className: "bg-yellow-100 text-yellow-700" },
};

function formatData(dataStr) {
  if (!dataStr) return "--";
  const [ano, mes, dia] = String(dataStr).split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function OrcamentosAbertosModal({ onClose }) {
  const navigate = useNavigate();
  const { data: todos = [], isLoading } = useOrcamentos();

  const abertos = todos.filter((orc) =>
    STATUS_ABERTOS.includes(orc.statusNome?.toUpperCase().trim())
  );

  const handleClickOrcamento = (orc) => {
    onClose();
    navigate(`/orcamentos/${orc.id}/editar`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-[#002A4B] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <div>
              <h2 className="text-base font-semibold">Orçamentos em Aberto</h2>
              <p className="text-xs text-blue-200">
                {isLoading ? "Carregando..." : `${abertos.length} orçamento${abertos.length !== 1 ? "s" : ""} pendente${abertos.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <span className="animate-pulse text-gray-400">Carregando orçamentos...</span>
            </div>
          ) : abertos.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">Nenhum orçamento em aberto.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {abertos.map((orc) => {
                const status = STATUS_CONFIG[orc.statusNome?.toUpperCase()] ?? {
                  label: orc.statusNome,
                  className: "bg-gray-100 text-gray-600",
                };
                return (
                  <button
                    key={orc.id}
                    type="button"
                    onClick={() => handleClickOrcamento(orc)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#002A4B]">
                          {orc.numeroOrcamento || `ORC-${orc.id}`}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {orc.clienteNome || "Cliente não informado"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatData(orc.dataOrcamento)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      <span className="text-base font-bold text-gray-800">
                        R$ {Number(orc.valorTotal ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && abertos.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <span className="text-xs text-gray-400">Clique em um orçamento para abrir o pedido</span>
            <span className="text-sm font-semibold text-[#002A4B]">
              Total: R$ {abertos.reduce((acc, orc) => acc + Number(orc.valorTotal ?? 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
