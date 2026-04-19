import { useState, useMemo } from "react";
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Briefcase,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  useAgendaFuncionario,
  useRemoverFuncionarioDeAgendamento,
} from "../../../../hooks";
import Swal from "sweetalert2";
import {
  normalizeStatus,
  getStatusColor,
  TIPO_COLORS,
} from "../../../../utils/agendamentoStatus";
import Button from "../../../../components/ui/Button/Button.component";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "—";
  return timeStr.slice(0, 5);
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatISO(date) {
  return date.toISOString().split("T")[0];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const ITEMS_PER_PAGE = 5;

export default function AgendaFuncionario({ open, setOpen, funcionario }) {
  const [viewMode, setViewMode] = useState("semana"); // "semana" | "mes"
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pagina, setPagina] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Período de busca baseado no modo de visualização
  const { dataInicio, dataFim } = useMemo(() => {
    if (viewMode === "semana") {
      const monday = getMonday(currentDate);
      const sunday = addDays(monday, 6);
      return { dataInicio: formatISO(monday), dataFim: formatISO(sunday) };
    }
    // mês
    const first = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const last = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
    );
    return { dataInicio: formatISO(first), dataFim: formatISO(last) };
  }, [viewMode, currentDate]);

  const {
    data: agenda = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAgendaFuncionario(funcionario?.id, dataInicio, dataFim, {
    enabled: open && !!funcionario?.id,
  });

  const removerMutation = useRemoverFuncionarioDeAgendamento({
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Removido!",
        text: "Funcionário removido do agendamento com sucesso.",
        timer: 2000,
        showConfirmButton: false,
      });
      setConfirmRemove(null);
      refetch();
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Erro ao remover",
        text:
          err?.message ||
          "Não foi possível remover o funcionário deste agendamento.",
      });
      setConfirmRemove(null);
    },
  });

  // Ordenar por data e horário
  const agendaOrdenada = useMemo(() => {
    return [...agenda].sort((a, b) => {
      const dateComp = (a.dataAgendamento || "").localeCompare(
        b.dataAgendamento || "",
      );
      if (dateComp !== 0) return dateComp;
      return (a.inicioAgendamento || "").localeCompare(
        b.inicioAgendamento || "",
      );
    });
  }, [agenda]);

  // Paginação
  const totalPaginas = Math.ceil(agendaOrdenada.length / ITEMS_PER_PAGE);
  const agendaPaginada = agendaOrdenada.slice(
    (pagina - 1) * ITEMS_PER_PAGE,
    pagina * ITEMS_PER_PAGE,
  );

  const navegarPeriodo = (direcao) => {
    setPagina(1);
    if (viewMode === "semana") {
      setCurrentDate((prev) => addDays(prev, direcao * 7));
    } else {
      setCurrentDate((prev) => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + direcao);
        return d;
      });
    }
  };

  const irParaHoje = () => {
    setPagina(1);
    setCurrentDate(new Date());
  };

  const handleRemover = (item) => {
    setConfirmRemove(item);
  };

  const confirmarRemocao = () => {
    if (!confirmRemove || !funcionario) return;
    removerMutation.mutate({
      agendamentoId: confirmRemove.agendamentoId,
      funcionarioId: funcionario.id,
    });
  };

  const getPeriodoLabel = () => {
    if (viewMode === "semana") {
      const monday = getMonday(currentDate);
      const sunday = addDays(monday, 6);
      const fmt = (d) =>
        d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `${fmt(monday)} — ${fmt(sunday)}`;
    }
    return currentDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] backdrop-blur-sm p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-[#eeeeee] p-2.5 rounded-lg">
              <Calendar className="w-6 h-6 text-[#828282]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Agenda do Funcionário
              </h2>
              <p className="text-sm text-gray-500">{funcionario?.nome}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Controles de navegação ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-b border-gray-100 gap-3">
          {/* Seletor de período */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => {
                  setViewMode("semana");
                  setPagina(1);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === "semana"
                    ? "bg-white text-[#007EA7] shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => {
                  setViewMode("mes");
                  setPagina(1);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  viewMode === "mes"
                    ? "bg-white text-[#007EA7] shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Mês
              </button>
            </div>
            <button
              onClick={irParaHoje}
              className="px-3 py-1.5 text-sm font-medium text-[#007EA7] hover:bg-[#007EA7]/10 rounded-md transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {/* Navegação do período */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navegarPeriodo(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center capitalize">
              {getPeriodoLabel()}
            </span>
            <button
              onClick={() => navegarPeriodo(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Badge com total */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#007EA7]/10 text-[#007EA7]">
              {agendaOrdenada.length} agendamento
              {agendaOrdenada.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-[#007EA7] animate-spin" />
              <p className="text-sm text-gray-500">Carregando agenda...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-600">
                {error?.message || "Erro ao carregar agenda."}
              </p>
              <button
                onClick={() => refetch()}
                className="text-sm text-[#007EA7] hover:underline cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : agendaOrdenada.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Calendar className="w-10 h-10 text-gray-300" />
              <p className="text-gray-500 text-sm">
                Nenhum agendamento neste período.
              </p>
            </div>
          ) : (
            <>
              {/* ── Tabela de agenda ── */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Data
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Horário
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Serviço
                      </th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendaPaginada.map((item) => {
                      const statusClass = getStatusColor(
                        item.statusAgendamento,
                      );
                      const tipoClass =
                        TIPO_COLORS[item.tipoAgendamento] ||
                        "bg-gray-100 text-gray-800";
                      const normalizedSt = normalizeStatus(
                        item.statusAgendamento,
                      );
                      const isCancelado = normalizedSt === "CANCELADO";
                      const isConcluido = normalizedSt === "CONCLUIDO";
                      const isUnicoNoServico =
                        item.tipoAgendamento === "SERVICO" &&
                        (item.quantidadeFuncionarios ?? 1) <= 1;

                      return (
                        <tr
                          key={item.agendamentoId}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                            isCancelado ? "opacity-60" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-900">
                                {formatDate(item.dataAgendamento)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700">
                                {formatTime(item.inicioAgendamento)} –{" "}
                                {formatTime(item.fimAgendamento)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 truncate max-w-[150px]">
                                {item.clienteNome || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-gray-700 truncate max-w-[140px]">
                                  {item.servicoNome || "—"}
                                </span>
                                {item.servicoCodigo && (
                                  <span className="text-xs text-gray-400">
                                    {item.servicoCodigo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tipoClass}`}
                            >
                              {item.tipoAgendamento === "SERVICO"
                                ? "Serviço"
                                : item.tipoAgendamento === "ORCAMENTO"
                                  ? "Orçamento"
                                  : item.tipoAgendamento || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                            >
                              {item.statusAgendamento || "—"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {!isCancelado && !isConcluido ? (
                              <button
                                onClick={() => !isUnicoNoServico && handleRemover(item)}
                                disabled={isUnicoNoServico}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isUnicoNoServico
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                }`}
                                title={
                                  isUnicoNoServico
                                    ? "Não é possível remover o único funcionário de um serviço"
                                    : "Remover funcionário deste agendamento"
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Paginação ── */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                  <span>
                    Mostrando {(pagina - 1) * ITEMS_PER_PAGE + 1} a{" "}
                    {Math.min(pagina * ITEMS_PER_PAGE, agendaOrdenada.length)}{" "}
                    de {agendaOrdenada.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPagina((p) => Math.min(totalPaginas, p + 1))
                      }
                      disabled={pagina === totalPaginas}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </div>
      </div>

      {/* ── Modal de confirmação de remoção ── */}
      {confirmRemove && (
        <div
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-[10000] backdrop-blur-sm"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2.5 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Remoção
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Deseja remover{" "}
              <strong className="text-gray-900">{funcionario?.nome}</strong> do
              agendamento?
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{formatDate(confirmRemove.dataAgendamento)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>
                  {formatTime(confirmRemove.inicioAgendamento)} –{" "}
                  {formatTime(confirmRemove.fimAgendamento)}
                </span>
              </div>
              {confirmRemove.servicoNome && (
                <div className="flex items-center gap-2 text-gray-700 mt-1">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span>{confirmRemove.servicoNome}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-4">
              ⚠️ Esta ação removerá o funcionário do agendamento. Se necessário,
              outro funcionário deverá ser alocado manualmente.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setConfirmRemove(null)}
                disabled={removerMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmarRemocao}
                disabled={removerMutation.isPending}
                startIcon={
                  removerMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )
                }
              >
                {removerMutation.isPending ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
